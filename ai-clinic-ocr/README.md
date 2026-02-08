# AI Clinic OCR Service

This service uses OpenCV and PaddleOCR to extract text from mixed Arabic/English medical forms.

## Setup

1.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

2.  **Activate the environment:**
    *   Windows: `venv\Scripts\activate`
    *   Linux/Mac: `source venv/bin/activate`

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Usage

1.  Place your medical form image in this directory (e.g., `form.jpg`).
2.  Edit `ocr_pipeline.py` to point to your image file:
    ```python
    test_image_path = "form.jpg"
    ```
3.  Run the script:
    ```bash
    python ocr_pipeline.py
    ```

## Output

The script will:
*   Print detected text to the console.
*   Attempt to extract specific fields like Name and Diagnosis.
*   Save the full raw and structured output to `ocr_output.json`.
