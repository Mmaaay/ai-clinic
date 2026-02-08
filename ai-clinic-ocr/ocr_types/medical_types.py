from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field

# Assuming these imports match the file structure you are building
from .patient_type import Patient
from .history_type import MedicalRecordExtraction
from .visit_type import ClinicalVisits
from .labs_type import LabsExtraction
from .imaging_type import ImagingEntry
from .followup_type import FollowUpEntry
from .notes_type import NoteEntry


class MedicalOCR(BaseModel):
    patient: Patient = Field(description="Patient demographic and baseline data")

    history: MedicalRecordExtraction = Field(
        description=" medical, surgical, and social "
    )

    labs: Optional[LabsExtraction] = Field(
        default=None, description="Pre and post operative laboratory results"
    )

    imaging: List[ImagingEntry] = Field(
        default_factory=list, description="Radiology and imaging reports"
    )

    followups: List[FollowUpEntry] = Field(
        default_factory=list, description="Follow-up call log entries"
    )

    visits: Optional[ClinicalVisits] = Field(
        default=None, description="Clinic visits and physical examinations"
    )

    notes: List[NoteEntry] = Field(
        default_factory=list,
        description="General free-form notes and administrative records",
    )
