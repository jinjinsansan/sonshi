-- ============================================
-- SONSHI GACHA Multi Gacha Transaction Helper
-- ============================================

CREATE OR REPLACE FUNCTION public.start_multi_gacha(
  p_user_id UUID,
  p_gacha_id UUID,
  p_ticket_type_id UUID,
  p_total_pulls INTEGER,
  p_session_type TEXT,
  p_results JSONB,
  p_scenario JSONB
)
RETURNS TABLE (session_id UUID, remaining_quantity INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  v_quantity INTEGER;
  v_session_id UUID;
  v_result JSONB;
  v_card_id UUID;
  v_serial INTEGER;
BEGIN
  SELECT quantity INTO v_quantity
  FROM user_tickets
  WHERE user_id = p_user_id AND ticket_type_id = p_ticket_type_id
  FOR UPDATE;

  IF v_quantity IS NULL OR v_quantity < p_total_pulls THEN
    RAISE EXCEPTION 'INSUFFICIENT_TICKETS';
  END IF;

  UPDATE user_tickets
  SET quantity = v_quantity - p_total_pulls,
      updated_at = NOW()
  WHERE user_id = p_user_id AND ticket_type_id = p_ticket_type_id;

  FOR v_result IN SELECT * FROM jsonb_array_elements(p_results)
  LOOP
    v_card_id := (v_result->>'cardId')::UUID;
    v_serial := (v_result->>'serialNumber')::INTEGER;

    UPDATE cards
    SET current_supply = COALESCE(current_supply, 0) + 1
    WHERE id = v_card_id
      AND COALESCE(current_supply, 0) + 1 <= max_supply;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'CARD_SUPPLY_EXCEEDED';
    END IF;

    INSERT INTO card_inventory (card_id, serial_number, owner_id, obtained_via)
    VALUES (v_card_id, v_serial, p_user_id, 'multi_gacha');

    INSERT INTO gacha_results (user_id, gacha_id, card_id, obtained_via)
    VALUES (p_user_id, p_gacha_id, v_card_id, 'multi_gacha');
  END LOOP;

  INSERT INTO multi_gacha_sessions (
    user_id,
    session_type,
    total_pulls,
    current_pull,
    scenario_path,
    status,
    results
  )
  VALUES (
    p_user_id,
    p_session_type,
    p_total_pulls,
    0,
    p_scenario,
    'in_progress',
    p_results
  )
  RETURNING id INTO v_session_id;

  session_id := v_session_id;
  remaining_quantity := v_quantity - p_total_pulls;
  RETURN NEXT;
END;
$$;
