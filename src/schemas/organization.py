from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from uuid import UUID


class AuthorityType(str, Enum):
    GOVERNMENT = "government"
    NON_GOVERNMENT = "non_government"
    OTHER = "other"


# DB schema (mirrors public.organizations table)
@dataclass
class Organization:
    id: UUID
    email: str
    created_at: datetime
    updated_at: datetime
    name: str | None = None
    authority_type: AuthorityType | None = None
    description: str | None = None
    phone: str | None = None
    address: str | None = None
    website: str | None = None
    verified: bool = False


# Signup — only email + password needed
@dataclass
class OrgSignup:
    email: str
    password: str


# Profile update — all fields optional (PATCH semantics)
@dataclass
class OrgProfileUpdate:
    name: str | None = None
    authority_type: str | None = None
    description: str | None = None
    phone: str | None = None
    address: str | None = None
    website: str | None = None


# Public output schema
@dataclass
class OrgOut:
    id: UUID
    email: str
    name: str | None
    authority_type: str | None
    verified: bool
    created_at: datetime
    updated_at: datetime
    description: str | None
    phone: str | None
    address: str | None
    website: str | None
