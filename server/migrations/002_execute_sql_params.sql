-- Add execute_select function for parameterized SELECT queries
CREATE OR REPLACE FUNCTION execute_select(query TEXT)
RETURNS SETOF JSONB AS $$
BEGIN
  RETURN QUERY EXECUTE query;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
