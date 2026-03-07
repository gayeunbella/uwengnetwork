import base64
import json

from app.config import settings
from app.schemas.auth import WatcardVerifyResponse


def verify_watcard(image_path: str) -> WatcardVerifyResponse:
    if not settings.WATCARD_VERIFICATION_ENABLED:
        return WatcardVerifyResponse(
            is_engineering=True,
            confidence=1.0,
            extracted_text="STUB_MODE_ENABLED",
        )
    return _verify_with_claude(image_path)


def _verify_with_claude(image_path: str) -> WatcardVerifyResponse:
    import anthropic

    with open(image_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")

    prompt = (
        "You are analyzing a student ID card image. Determine if this is a University of "
        "Waterloo WATCARD belonging to a Faculty of Engineering student.\n\n"
        "Look for:\n"
        "1. The text \"University of Waterloo\" or the UW logo\n"
        "2. The word \"Engineering\" anywhere on the card (this indicates Faculty of Engineering)\n\n"
        "Return ONLY a JSON object with no other text:\n"
        "{\n"
        '  "is_engineering": true or false,\n'
        '  "confidence": 0.0 to 1.0,\n'
        '  "extracted_text": "all readable text from the card"\n'
        "}"
    )

    client = anthropic.Anthropic(api_key=settings.VISION_API_KEY)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": image_data,
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    )

    result = json.loads(message.content[0].text)
    return WatcardVerifyResponse(
        is_engineering=result["is_engineering"],
        confidence=result["confidence"],
        extracted_text=result["extracted_text"],
    )
