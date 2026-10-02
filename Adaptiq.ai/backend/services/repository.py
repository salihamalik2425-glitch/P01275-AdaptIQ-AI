from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from threading import RLock
from uuid import UUID, uuid4

from config import settings
from errors import ValidationError
from models.schemas import HistoryEntry, LearningTwin, ProgressResponse, QuizSubmitRequest
from services.supabase_client import get_supabase_client


class DevelopmentRepository:
    """Temporary process-local store used until Supabase is connected."""

    def __init__(self) -> None:
        self._lock = RLock()
        self._twins: dict[str, LearningTwin] = {}
        self._history: dict[str, list[HistoryEntry]] = defaultdict(list)
        self._scores: dict[str, list[float]] = defaultdict(list)
        self._topics: dict[str, set[str]] = defaultdict(set)

    def get_twin(self, student_id: str) -> LearningTwin:
        with self._lock:
            if student_id not in self._twins:
                self._twins[student_id] = LearningTwin(
                    student_id=student_id,
                    updated_at=datetime.now(timezone.utc),
                )
            return self._twins[student_id].model_copy(deep=True)

    def update_twin(self, student_id: str, updates: dict) -> LearningTwin:
        with self._lock:
            twin = self.get_twin(student_id)
            values = twin.model_dump()
            values.update({key: value for key, value in updates.items() if value is not None})
            values["updated_at"] = datetime.now(timezone.utc)
            self._twins[student_id] = LearningTwin(**values)
            return self._twins[student_id].model_copy(deep=True)

    def submit_quiz(self, request: QuizSubmitRequest) -> tuple[str, int, LearningTwin]:
        score = round(request.correct_answers / request.total_questions * 100)
        result_id = str(uuid4())
        with self._lock:
            twin = self.get_twin(request.student_id)
            confidence_delta = 3 if score >= 80 else -3 if score < 50 else 0
            weak_topics = list(twin.weak_topics)
            if score < 70 and request.topic not in weak_topics:
                weak_topics.append(request.topic)
            if score >= 80:
                weak_topics = [topic for topic in weak_topics if topic != request.topic]
            mistakes = list(twin.recurring_mistakes)
            for mistake in request.mistakes:
                if mistake not in mistakes:
                    mistakes.append(mistake)
            strong_topics = list(twin.strong_topics)
            if score >= 80 and request.topic not in strong_topics:
                strong_topics.append(request.topic)
            updated = self.update_twin(
                request.student_id,
                {
                    "confidence_score": max(0, min(100, twin.confidence_score + confidence_delta)),
                    "weak_topics": weak_topics,
                    "strong_topics": strong_topics,
                    "recurring_mistakes": mistakes,
                },
            )
            self._scores[request.student_id].append(score)
            self._topics[request.student_id].add(request.topic)
            self._history[request.student_id].insert(
                0,
                HistoryEntry(
                    id=result_id,
                    activity_type="quiz_completed",
                    topic=request.topic,
                    performance=score,
                    created_at=datetime.now(timezone.utc),
                ),
            )
            return result_id, score, updated

    def get_progress(self, student_id: str) -> ProgressResponse:
        with self._lock:
            scores = self._scores[student_id]
            return ProgressResponse(
                quizzes_completed=len(scores),
                average_score=round(sum(scores) / len(scores), 1) if scores else 0,
                topics_studied=len(self._topics[student_id]),
                learning_streak=0,
            )

    def get_history(self, student_id: str, limit: int = 50) -> list[HistoryEntry]:
        with self._lock:
            return [entry.model_copy(deep=True) for entry in self._history[student_id][:limit]]


class SupabaseRepository:
    """Supabase-backed implementation of the repository used by API routes."""

    def __init__(self) -> None:
        self.client = get_supabase_client()

    @staticmethod
    def _student_uuid(student_id: str) -> str:
        try:
            return str(UUID(student_id))
        except ValueError as error:
            raise ValidationError(
                "student_id must be a Supabase Auth user UUID when Supabase is enabled."
            ) from error

    @staticmethod
    def _twin_from_row(row: dict) -> LearningTwin:
        return LearningTwin(**row)

    def get_twin(self, student_id: str) -> LearningTwin:
        student_uuid = self._student_uuid(student_id)
        response = (
            self.client.table("learning_twins")
            .select("*")
            .eq("student_id", student_uuid)
            .limit(1)
            .execute()
        )
        if not response.data:
            return LearningTwin(student_id=student_id, updated_at=datetime.now(timezone.utc))
        return self._twin_from_row(response.data[0])

    def update_twin(self, student_id: str, updates: dict) -> LearningTwin:
        payload = {"student_id": self._student_uuid(student_id)}
        payload.update({key: value for key, value in updates.items() if value is not None})
        response = (
            self.client.table("learning_twins")
            .upsert(payload, on_conflict="student_id")
            .execute()
        )
        if not response.data:
            return self.get_twin(student_id)
        return self._twin_from_row(response.data[0])

    def submit_quiz(self, request: QuizSubmitRequest) -> tuple[str, int, LearningTwin]:
        student_uuid = self._student_uuid(request.student_id)
        score = round(request.correct_answers / request.total_questions * 100)
        twin = self.get_twin(request.student_id)
        confidence_delta = 3 if score >= 80 else -3 if score < 50 else 0
        weak_topics = list(twin.weak_topics)
        if score < 70 and request.topic not in weak_topics:
            weak_topics.append(request.topic)
        if score >= 80:
            weak_topics = [topic for topic in weak_topics if topic != request.topic]
        mistakes = list(twin.recurring_mistakes)
        for mistake in request.mistakes:
            if mistake not in mistakes:
                mistakes.append(mistake)
        strong_topics = list(twin.strong_topics)
        if score >= 80 and request.topic not in strong_topics:
            strong_topics.append(request.topic)
        updated = self.update_twin(
            request.student_id,
            {
                "confidence_score": max(0, min(100, twin.confidence_score + confidence_delta)),
                "weak_topics": weak_topics,
                "strong_topics": strong_topics,
                "recurring_mistakes": mistakes,
            },
        )
        result = self.client.table("quiz_results").insert(
            {
                "student_id": student_uuid,
                "topic": request.topic,
                "score": score,
                "total_questions": request.total_questions,
                "mistakes": request.mistakes,
            }
        ).execute()
        result_id = result.data[0]["id"]
        self.client.table("learning_history").insert(
            {
                "student_id": student_uuid,
                "activity_type": "quiz_completed",
                "topic": request.topic,
                "performance": score,
            }
        ).execute()
        return result_id, score, updated

    def get_progress(self, student_id: str) -> ProgressResponse:
        student_uuid = self._student_uuid(student_id)
        response = (
            self.client.table("quiz_results")
            .select("score, topic")
            .eq("student_id", student_uuid)
            .execute()
        )
        rows = response.data or []
        scores = [float(row["score"]) for row in rows]
        return ProgressResponse(
            quizzes_completed=len(scores),
            average_score=round(sum(scores) / len(scores), 1) if scores else 0,
            topics_studied=len({row["topic"] for row in rows}),
            learning_streak=0,
        )

    def get_history(self, student_id: str, limit: int = 50) -> list[HistoryEntry]:
        student_uuid = self._student_uuid(student_id)
        response = (
            self.client.table("learning_history")
            .select("id, activity_type, topic, performance, created_at")
            .eq("student_id", student_uuid)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return [HistoryEntry(**row) for row in (response.data or [])]


def create_repository() -> DevelopmentRepository | SupabaseRepository:
    if settings.supabase_url and settings.supabase_service_role_key:
        return SupabaseRepository()
    return DevelopmentRepository()


repository = create_repository()
