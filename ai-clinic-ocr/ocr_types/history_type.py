from __future__ import annotations
from datetime import date
from typing import Literal, Optional, List
from pydantic import BaseModel, Field

# --- Enums (Aligned with Zod) ---

AllergySeverityEnum = Literal["Mild", "Moderate", "Severe", "Life Threatening"]

MedicalHistoryEnum = Literal["Active", "Remission", "Resolved"]

ComplaintType = Literal["Chief Complaint", "Past History"]

SocialHistoryCategoryEnum = Literal["Smoking", "Alcohol", "Diet", "Exercise"]

MedicationTypeEnum = Literal["Home", "Pre-op", "Inpatient"]

ProcedureTypeEnum = Literal[
    "Sleeve Gastrectomy",
    "Gastric Bypass (RNY)",
    "Mini Gastric Bypass (MGB)",
    "SASI",
    "Gastric Balloon",
    "Revisional Surgery",
    "Other",
]

# --- Nested Models (Aligned with Drizzle/Zod Schemas) ---


class PatientConditionEntry(BaseModel):
    conditionName: str = Field(
        description="Name of the medical condition (e.g., 'Hypertension')"
    )
    conditionStatus: Optional[MedicalHistoryEnum] = Field(
        default="Active", description="Status: 'Active', 'Remission', or 'Resolved'"
    )
    onsetDate: Optional[date] = Field(
        default=None, description="When the condition started"
    )
    # Note: 'type' handles if it's a Chief Complaint or History
    type: Optional[ComplaintType] = Field(
        default="Chief Complaint",
        description="Is this the main reason for visit or past history?",
    )
    notes: Optional[str] = Field(
        default="", description="Additional details about the condition"
    )


class PatientMedicationEntry(BaseModel):
    # Renamed from drug_name to match Zod
    drugName: str = Field(description="Name of the medication")
    dosage: Optional[str] = Field(
        default="0", description="Dosage strength (e.g., '500mg')"
    )
    frequency: Optional[str] = Field(default="0", description="Frequency (e.g., 'BID')")
    type: Optional[MedicationTypeEnum] = Field(
        default="Home", description="Context: 'Home', 'Pre-op', or 'Inpatient'"
    )
    startDate: Optional[date] = Field(default=None, description="Start date")
    endDate: Optional[date] = Field(default=None, description="End date")
    notes: Optional[str] = Field(default="", description="Instructions or comments")


class PatientSurgeryEntry(BaseModel):
    # Renamed from procedure to procedureName
    procedureName: str = Field(description="Name of the past surgery")
    # Added procedureType defaults to 'Other' if unknown
    procedureType: Optional[ProcedureTypeEnum] = Field(
        default="Other", description="Category of the procedure"
    )

    # --- Dates & Location ---
    surgeryDate: Optional[date] = Field(default=None, description="Date of the surgery")
    hospitalName: Optional[str] = Field(
        default="", description="Hospital where surgery was performed"
    )

    # --- Surgical Team ---
    surgeonName: Optional[str] = Field(
        default="", description="Name of the primary surgeon"
    )
    firstAssistant: Optional[str] = Field(
        default="", description="Name of the first assistant"
    )
    secondAssistant: Optional[str] = Field(
        default="", description="Name of the second assistant"
    )
    dissectionBy: Optional[str] = Field(
        default="", description="Name of the person who performed dissection"
    )
    cameraMan: Optional[str] = Field(
        default="",
        description="Name of the camera operator (for endoscopic/laparoscopic procedures)",
    )

    # --- Notes ---
    operativeNotes: Optional[str] = Field(
        default="", description="Detailed operative notes or full report text"
    )
    summaryNotes: Optional[str] = Field(
        default="", description="Short summary of the procedure or complications"
    )


class PatientAllergyEntry(BaseModel):
    allergen: str = Field(description="Substance causing allergy")
    reaction: Optional[str] = Field(default="", description="Reaction details")
    severity: Optional[AllergySeverityEnum] = Field(
        default="Mild", description="Severity level"
    )


class PatientSocialHistoryEntry(BaseModel):
    category: Optional[SocialHistoryCategoryEnum] = Field(
        default="Smoking", description="Category"
    )
    value: str = Field(description="Details (e.g., '1 pack/day')")
    notes: Optional[str] = Field(default="", description="Additional context")


class PatientEntry(BaseModel):
    name: str = Field(description="Patient full name")
    phone: Optional[str] = Field(default="", description="Primary phone number")
    age: Optional[int] = Field(default=None, description="Patient age")
    gender: Optional[Literal["Male", "Female"]] = Field(default=None)


# --- Main Extraction Model ---


class MedicalRecordExtraction(BaseModel):
    # Renamed lists to match Zod schema keys exactly
    patientConditions: List[PatientConditionEntry] = Field(
        default_factory=list, description="Past and present conditions"
    )
    patientMedications: List[PatientMedicationEntry] = Field(
        default_factory=list, description="Current medications"
    )
    patientSurgeries: List[PatientSurgeryEntry] = Field(
        default_factory=list, description="Previous surgeries"
    )
    patientAllergies: List[PatientAllergyEntry] = Field(
        default_factory=list, description="Allergies list"
    )
    patientSocialHistory: List[PatientSocialHistoryEntry] = Field(
        default_factory=list, description="Lifestyle habits"
    )
