from datetime import datetime
from enum import Enum

from pydantic import UUID4, BaseModel


class ReportCategory(Enum):
    ROAD = "road"
    DRAINAGE = "drainage"
    WATER = "water"
    ELECTRICITY = "electricity"
    GARBAGE = "garbage"
    ENVIRONMENT = "environment"
    ANIMALS = "animals"
    ACCIDENT = "accident"
    CRIME = "crime"
    OTHER = "other"


class ReportSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ReportStatus(Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    INREVIEW = "in_review"
    RESOLVED = "resolved"


class Report(BaseModel):
    id: UUID4 | None = None
    description: str = ""
    location: tuple[float, float] | None = None
    date: datetime = datetime.now(datetime.timezone.utc)
    category: ReportCategory = ReportCategory.OTHER
    severity: ReportSeverity = ReportSeverity.LOW
    authority: str | None = None
    status: ReportStatus = ReportStatus.PENDING
