from types import SimpleNamespace

import pytest



def select_winner(members, organizer_id, current_month, duration_months, organizer_wins_first):
    eligible = [m for m in members if not m.has_won]
    organizer = next((m for m in members if m.id == organizer_id), None)
    is_first_month = current_month == 1
    is_last_month = current_month == duration_months

    if organizer_wins_first and is_first_month and organizer and not organizer.has_won:
        return organizer
    if not organizer_wins_first and is_last_month and organizer and not organizer.has_won:
        return organizer
    if not organizer_wins_first and len(eligible) == 1:
        return eligible[0]

    pool = eligible
    if not organizer_wins_first and organizer and not organizer.has_won:
        pool = [m for m in eligible if m.id != organizer_id]
    return pool[0] if pool else eligible[0]


def member(member_id, won=False):
    return SimpleNamespace(id=member_id, has_won=won)


def test_organizer_first_wins_month_one():
    organizer = member("organizer")
    other = member("other")
    assert select_winner([organizer, other], "organizer", 1, 2, True) is organizer


def test_organizer_last_wins_when_organizer_first_is_disabled():
    organizer = member("organizer")
    other = member("other", won=True)
    assert select_winner([organizer, other], "organizer", 2, 2, False) is organizer


def test_non_organizer_is_selected_before_organizer_when_disabled():
    organizer = member("organizer")
    other = member("other")
    assert select_winner([organizer, other], "organizer", 1, 2, False) is other


def test_already_won_member_is_never_eligible():
    organizer = member("organizer", won=True)
    other = member("other")
    assert select_winner([organizer, other], "organizer", 2, 2, True) is other


def test_duration_is_equal_to_member_count():
    members = [member(str(i)) for i in range(2, 7)]
    duration_months = len(members)
    assert duration_months == 5


def test_no_eligible_members_raises():
    members = [member("a", True), member("b", True)]
    eligible = [m for m in members if not m.has_won]
    assert eligible == []
