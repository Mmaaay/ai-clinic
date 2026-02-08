from __future__ import annotations

from datetime import date
from typing import Literal, Optional, List
from pydantic import BaseModel, Field

visitTypeEnum = Literal["Routine", "Urgent"]

woundStatusEnum = Literal["Clean", "Infected", "Dehisced", "Other"]


class VisitEntry(BaseModel):
    visit_date: Optional[date] = Field(default=None, description="Date of visit")
    type: Optional[visitTypeEnum] = Field(
        default="Routine", description="'Routine' or 'Urgent'"
    )
    weight_kg: Optional[float] = Field(default=None, description="Patient weight in kg")
    wound_status: Optional[woundStatusEnum] = Field(
        default=None, description="Condition of wound: 'Clean', 'Infected', etc."
    )
    clinical_findings: Optional[str] = Field(
        default=None, description="Doctor's physical exam notes"
    )
    plan: Optional[str] = Field(
        default=None, description="Recommendations, prescriptions, or next steps"
    )


class ClinicalVisits(BaseModel):
    visits: List[VisitEntry] = Field(
        default_factory=list, description="Outpatient clinical visits"
    )
