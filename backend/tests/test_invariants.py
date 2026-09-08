from types import SimpleNamespace


def test_winners_are_unique_by_member():
    draws = [
        SimpleNamespace(winner_id="m1", month=1),
        SimpleNamespace(winner_id="m2", month=2),
        SimpleNamespace(winner_id="m3", month=3),
    ]
    assert len({draw.winner_id for draw in draws}) == len(draws)


def test_one_draw_per_month_in_domain_model():
    draws = [
        SimpleNamespace(chit_fund_id="c1", month=1),
        SimpleNamespace(chit_fund_id="c1", month=2),
        SimpleNamespace(chit_fund_id="c2", month=1),
    ]
    keys = {(draw.chit_fund_id, draw.month) for draw in draws}
    assert len(keys) == len(draws)


def test_one_payment_per_member_per_month_in_domain_model():
    payments = [
        SimpleNamespace(chit_fund_id="c1", member_id="m1", month=1),
        SimpleNamespace(chit_fund_id="c1", member_id="m2", month=1),
        SimpleNamespace(chit_fund_id="c1", member_id="m1", month=2),
    ]
    keys = {(p.chit_fund_id, p.member_id, p.month) for p in payments}
    assert len(keys) == len(payments)
