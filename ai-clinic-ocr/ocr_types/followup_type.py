from __future__ import annotations

from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class FollowUpEntry(BaseModel):
    call_date: Optional[str] = Field(default=None, description="Date of the call")
    medication_adherence: Optional[List[str]] = Field(
        default=None,
        description="List of medications with adherence notes (e.g., ['PPI - taking daily', 'Clexane - missed one dose'])",
    )
    symptoms: Optional[List[str]] = Field(
        default=None,
        description="List of reported symptoms (e.g., ['Nausea', 'Pain', 'Vomiting'])",
    )
    diet_activity: Optional[Dict[str, str]] = Field(
        default=None,
        description="Diet stage and activity level (e.g., {'diet': 'Full liquids', 'activity': 'Light walking'})",
    )
    bowel_urine: Optional[Dict[str, str]] = Field(
        default=None,
        description="Stool and urine status (e.g., {'bowel': 'Normal stool', 'urine': 'Normal frequency'})",
    )
    alarming_signs: Optional[List[str]] = Field(
        default=None, description="List of red flags like fever or severe pain"
    )
    general_notes: Optional[str] = Field(
        default=None, description="General summary of the call"
    )


class FollowUps(BaseModel):
    logs: List[FollowUpEntry] = Field(
        default_factory=list, description="Post-op follow-up call logs"
    )


# Alias for compatibility
FollowUpEntry = FollowUpEntry
