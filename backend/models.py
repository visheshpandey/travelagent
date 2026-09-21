"""Pydantic request/response models matching the API Contract (build doc section 3)."""

from typing import Optional

from pydantic import BaseModel


class GoogleLoginRequest(BaseModel):
    id_token: str


class UserOut(BaseModel):
    sub: str
    email: str
    name: str
    picture: Optional[str] = None


class LoginResponse(BaseModel):
    session_token: str
    user: UserOut


class GenerateItineraryRequest(BaseModel):
    destinations: list[str]
    start_date: str
    end_date: str
    budget_total: float
    interests: list[str] = []
    must_visit: list[str] = []
    travel_gap: bool = False


class ModifyRequest(BaseModel):
    trip_id: str
    budget_total: Optional[float] = None
    interests: Optional[list[str]] = None
    must_visit: Optional[list[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    destinations: Optional[list[str]] = None
    travel_gap: Optional[bool] = None


class PoiSummary(BaseModel):
    id: str
    name: str
    category: str
    rating: Optional[float] = None


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
    lat: Optional[float] = None
    lng: Optional[float] = None


class DayPlan(BaseModel):
    date: str
    items: list[ItineraryItem]
    day_cost: float
    destination: Optional[str] = None
    is_travel_day: bool = False


class Accommodation(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    rating: Optional[float] = None
    cost_per_night: float
    destination: Optional[str] = None


class ConflictItem(BaseModel):
    day: str
    item_ids: list[str]
    issue: str


class ItineraryResponse(BaseModel):
    trip_id: str
    days: list[DayPlan]
    total_cost: float
    accommodation: Optional[Accommodation] = None
    conflicts: list[ConflictItem] = []
    destinations: Optional[list[str]] = None
    accommodations: Optional[list[Accommodation]] = None


class DisruptResponse(BaseModel):
    trip_id: str
    days: list[DayPlan]
    explanation: str
    conflicts: list[ConflictItem] = []


class TripConstraintsOut(BaseModel):
    start_date: str
    end_date: str
    budget_total: float
    interests: list[str]
    must_visit: list[str]


class AskResponse(BaseModel):
    answer: str
    action: str = "answer"
    modify_result: Optional[ItineraryResponse] = None
    disrupt_result: Optional[DisruptResponse] = None
    updated_constraints: Optional[TripConstraintsOut] = None


class BackupOption(BaseModel):
    poi: str
    category: str


class DayBreakdown(BaseModel):
    date: str
    accommodation_cost: float
    travel_cost: float
    legs: list[dict]
    destination: Optional[str] = None


class DashboardResponse(BaseModel):
    trip_id: str
    itinerary: list[DayPlan]
    day_breakdown: list[DayBreakdown]
    total_cost: float
    backup_options: list[BackupOption]
    accommodation: Optional[Accommodation] = None
    grand_total: float
    destinations: Optional[list[str]] = None
    accommodations: Optional[list[Accommodation]] = None


class ConflictResponse(BaseModel):
    conflicts: list[ConflictItem]


class AlternativeSuggestion(BaseModel):
    id: str
    name: str
    category: str
    rating: Optional[float] = None


class SuggestAlternativesRequest(BaseModel):
    trip_id: str
    item_id: str


class SuggestAlternativesResponse(BaseModel):
    alternatives: list[AlternativeSuggestion]


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
