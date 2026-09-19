"""Pydantic request/response models matching the API Contract (build doc section 3)."""

from typing import Optional

from pydantic import BaseModel


class GenerateItineraryRequest(BaseModel):
    destination: str
    start_date: str
    end_date: str
    budget_total: float
    interests: list[str] = []


class ModifyRequest(BaseModel):
    trip_id: str
    budget_total: Optional[float] = None
    interests: Optional[list[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class DisruptRequest(BaseModel):
    trip_id: str
    item_id: str
    reason: str


class AskRequest(BaseModel):
    trip_id: str
    question: str


class ItineraryItem(BaseModel):
    id: str
    poi: str
    start: str
    end: str
    cost: float
    category: str


class DayPlan(BaseModel):
    date: str
    items: list[ItineraryItem]
    day_cost: float


class ItineraryResponse(BaseModel):
    trip_id: str
    days: list[DayPlan]
    total_cost: float


class DisruptResponse(BaseModel):
    trip_id: str
    days: list[DayPlan]
    explanation: str


class AskResponse(BaseModel):
    answer: str


class BackupOption(BaseModel):
    poi: str
    category: str


class DashboardResponse(BaseModel):
    trip_id: str
    itinerary: list[DayPlan]
    transportation: list[dict]
    total_cost: float
    backup_options: list[BackupOption]


class ConflictItem(BaseModel):
    day: str
    item_ids: list[str]
    issue: str


class ConflictResponse(BaseModel):
    conflicts: list[ConflictItem]


class AtRiskItem(BaseModel):
    item_id: str
    poi: str
    date: str
    category: str


class WeatherCheckResponse(BaseModel):
    destination: str
    condition: str
    description: str
    temp_c: float
    is_severe: bool
    at_risk_items: list[AtRiskItem]
