from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from uuid import UUID


class ReportCategory(str, Enum):
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


class ReportSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ReportStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"


# DB schema
@dataclass
class Report:
    id: UUID
    title: str
    description: str
    latitude: float
    longitude: float
    submitted_at: datetime
    updated_at: datetime
    category: ReportCategory | None = None
    severity: ReportSeverity | None = None
    comments: str = ""
    media_urls: list[str] | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    status: ReportStatus = ReportStatus.PENDING
    authority: UUID | None = None


# Public submission
@dataclass
class ReportSubmit:
    title: str
    description: str
    category: ReportCategory
    severity: ReportSeverity
    latitude: float
    longitude: float
    media_urls: list[str] | None = None
    contact_email: str | None = None
    contact_phone: str | None = None


# Public listing
@dataclass
class Authority:
    name: str
    profile_url: str


@dataclass
class ReportOut:
    id: UUID
    title: str
    description: str
    category: ReportCategory
    severity: ReportSeverity
    latitude: float | None
    longitude: float | None
    status: ReportStatus
    authority: Authority
    media_urls: list[str]
    submitted_at: datetime
    updated_at: datetime


@dataclass
class ReportListOut:
    total: int
    page: int
    page_size: int
    results: list[ReportOut]
