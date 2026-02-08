from __future__ import annotations

from datetime import date
from typing import Literal, Optional, List
from pydantic import BaseModel, Field

imagingModalityEnum = Literal[
    "Ultrasound",
    "X-Ray",
    "Echocardiogram",
    "CT Scan",
    "MRI",
    "Endoscopy",
    "Other",
]


class ImagingEntry(BaseModel):
    study_name: str = Field(
        description="Name of the scan (e.g., 'Abdominal Ultrasound', 'Chest X-Ray')"
    )
    modality: Optional[imagingModalityEnum] = Field(
        default="Other", description="Type: 'Ultrasound', 'X-Ray', 'CT', 'MRI'"
    )
    image_date: Optional[date] = Field(default=None, description="imaging date")
    findings: Optional[List[str]] = Field(
        default=None, description="List of detailed findings from the report"
    )
    impression: Optional[str] = Field(
        default=None, description="Summary conclusion or diagnosis"
    )
    preoperative: Optional[bool] = Field(
        default=True, description="Is this a preoperative scan?"
    )


class Imaging(BaseModel):
    entries: List[ImagingEntry] = Field(
        default_factory=list, description="List of imaging reports"
    )
