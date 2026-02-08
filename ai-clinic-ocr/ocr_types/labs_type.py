from __future__ import annotations
from typing import Optional, List, Dict, Literal
from pydantic import BaseModel, Field


# 1. Define the structure for the 'jsonb' column "results"
class LabResultContent(BaseModel):
    value: Optional[str] = Field(
        default=None, description="Numeric or text result value"
    )
    unit: Optional[str] = Field(
        default=None, description="Unit of measurement (e.g. mg/dl)"
    )
    reference_range: Optional[Dict[str, str]] = Field(
        default=None, description="Reference range (e.g., {'min': '13', 'max': '18'})"
    )


# 2. Define the main table row schema matching 'patientLabs'
class LabEntry(BaseModel):
    # Matches: varchar("test_name")
    testName: str = Field(..., description="Name of the lab test")

    # Matches: timestamp("lab_date")
    labDate: Optional[str] = Field(
        default=None, description="Date the lab was taken (ISO 8601 format YYYY-MM-DD)"
    )

    # Matches: jsonb("results")
    # This nests the specific data into the JSON column structure
    results: Optional[LabResultContent] = Field(
        default=None,
        description="JSON object containing value, unit, and reference range",
    )

    # Matches: pgEnum("lab_category")
    category: Literal["Preoperative", "Postoperative", "Non-routine"] = Field(
        default="Preoperative", description="Timing category of the lab"
    )

    # Matches: pgEnum("lab_status")
    status: Literal["Pending", "Final", "Cancelled"] = Field(
        default="Final", description="Status of the result"
    )

    # Matches: text("notes")
    notes: Optional[str] = Field(
        default=None, description="Clinical notes or flags (e.g. 'High')"
    )


# 3. Root container for extraction
class LabsExtraction(BaseModel):
    labs: List[LabEntry] = Field(
        default_factory=list, description="List of all extracted lab records"
    )
