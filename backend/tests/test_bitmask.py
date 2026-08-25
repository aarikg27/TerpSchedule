from app.utils.bitmask import build_mask, masks_conflict, empty_day_masks, DAYS, DAY_START, DAY_END, SLOT_SIZE

def test_build_mask_basic():
    # 9:00 (540) to 9:50 (590) should produce a non-zero mask
    mask = build_mask(540, 590)
    assert mask > 0

def test_adjacent_no_conflict():
    # 9:00 (540) to 9:50 (590) and 9:50 (590) to 10:40 (640)
    mask1 = build_mask(540, 590)
    mask2 = build_mask(590, 640)
    assert not masks_conflict(mask1, mask2)

def test_overlapping_conflict():
    # 9:00-10:00 (540-600) and 9:30-10:30 (570-630)
    mask1 = build_mask(540, 600)
    mask2 = build_mask(570, 630)
    assert masks_conflict(mask1, mask2)

def test_same_time_conflict():
    # same time range conflicts with itself
    mask = build_mask(540, 590)
    assert masks_conflict(mask, mask)

def test_zero_duration_no_mask():
    # start == end returns 0
    mask = build_mask(540, 540)
    assert mask == 0

def test_online_no_conflict():
    # mask of 0 never conflicts
    mask1 = 0
    mask2 = build_mask(540, 590)
    assert not masks_conflict(mask1, mask2)

def test_day_boundary():
    # classes at DAY_START and DAY_END-1 should work
    mask1 = build_mask(DAY_START, DAY_START + SLOT_SIZE)
    mask2 = build_mask(DAY_END - SLOT_SIZE, DAY_END)
    assert mask1 > 0
    assert mask2 > 0
    assert not masks_conflict(mask1, mask2)

def test_empty_day_masks():
    # returns dict with 5 days all zero
    masks = empty_day_masks()
    assert len(masks) == 5
    for day in DAYS:
        assert day in masks
        assert masks[day] == 0
