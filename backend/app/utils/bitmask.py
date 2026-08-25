DAY_START = 480   # 8:00 AM in minutes from midnight
DAY_END = 1320    # 10:00 PM
SLOT_SIZE = 5     # 5-minute intervals
TOTAL_SLOTS = (DAY_END - DAY_START) // SLOT_SIZE  # 168

DAYS = ["M", "Tu", "W", "Th", "F"]

def time_to_slot(minutes_from_midnight: int) -> int:
    """Map a minute offset to a bit index (0-167)."""
    return (minutes_from_midnight - DAY_START) // SLOT_SIZE

def build_mask(start_min: int, end_min: int) -> int:
    """Build an integer bitmask with bits set for every 5-min slot in [start, end)."""
    if start_min >= end_min:
        return 0
    start_slot = time_to_slot(max(start_min, DAY_START))
    end_slot = time_to_slot(min(end_min, DAY_END))
    
    mask = 0
    for i in range(start_slot, end_slot):
        mask |= (1 << i)
    return mask

def masks_conflict(mask_a: int, mask_b: int) -> bool:
    return (mask_a & mask_b) != 0

def empty_day_masks() -> dict[str, int]:
    return {day: 0 for day in DAYS}
