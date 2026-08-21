from datetime import datetime
from enum import Enum

from pydantic import BaseModel


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


class ReportSubmit(BaseModel):
    title: str
    description: str
    latitude: float
    longitude: float
    category: ReportCategory | None = None
    severity: ReportSeverity | None = None
    media_urls: list[str] | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    token: str  # Genrated token from front end as an auth to public report


class ReportFilter(BaseModel):
    title: str | None = None
    category: ReportCategory | None = None
    severity: ReportSeverity | None = None
    status: ReportStatus | None = None
    authority: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    latitude: float | None = None
    longitude: float | None = None
    radius: float | None = None
    page: int = 1
    page_size: int = 20


class AuthorityType(str, Enum):
    GOVERNMENT = "government"
    NON_GOVERNMENT = "non_government"
    OTHER = "other"


class OrgSignup(BaseModel):
    name: str
    email: str
    password: str


class OrgSignin(BaseModel):
    email: str
    password: str


class OrgProfileUpdate(BaseModel):
    name: str
    authority_type: ReportCategory | None = None
    description: str | None = None
    phone: str | None = None
    address: str | None = None
    website: str | None = None
