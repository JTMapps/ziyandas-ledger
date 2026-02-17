import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

/* ============================================================================
   METRIC COMPONENT
============================================================================ */
function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="font-semibold text-base">
        {new Intl.NumberFormat().format(Number(value) || 0)}
      </span>
    </div>
  );
}

/* ============================================================================
   PROFILE PAGE (REFRESHED)
============================================================================ */
export default function ProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ============================================================================
     LOAD PROFILE
  ============================================================================ */
  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      // 1. Get user
      const { data: authData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = authData.user;
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      // 2. Load entities created by user
      const { data: entityData, error: entityError } = await supabase
        .from("entities")
        .select("*")
        .eq("created_by", user.id);

      if (entityError) throw entityError;

      setEntities(entityData || []);

      // 3. Load snapshots — parallel RPC calls
      const snapshotCalls = (entityData || []).map(async (entity: any) => {
        const { data } = await supabase.rpc("get_entity_snapshot", {
          p_entity_id: entity.id,
        });
        return { id: entity.id, snapshot: data };
      });

      const resolved = await Promise.all(snapshotCalls);

      const snapshotMap: Record<string, any> = {};
      resolved.forEach((x) => (snapshotMap[x.id] = x.snapshot));

      setSnapshots(snapshotMap);
    } catch (err: any) {
      setError(err.message || "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================================
     SIGN OUT
  ============================================================================ */
  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  }

  /* ============================================================================
     AGGREGATES
  ============================================================================ */
  const totalEntities = entities.length;

  const totalEvents = Object.values(snapshots).reduce(
    (sum, s: any) => sum + (s?.event_count || 0),
    0
  );

  const aggregateEquity = Object.values(snapshots).reduce(
    (sum, s: any) => sum + (s?.total_equity || 0),
    0
  );

  /* ============================================================================
     LOADING UI
  ============================================================================ */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ------------------------------------------------------------------ */}
        {/* ERRORS */}
        {/* ------------------------------------------------------------------ */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PROFILE SUMMARY */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-4">Financial Steward Profile</h1>

          <div className="grid grid-cols-3 gap-6 text-sm">
            <Metric label="Entities" value={totalEntities} />
            <Metric label="Total Events" value={totalEvents} />
            <Metric label="Aggregate Equity" value={aggregateEquity} />
          </div>

          <div className="mt-6 text-gray-600 text-sm space-y-1">
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Member Since:</strong>{" "}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : "—"}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="mt-4 text-red-600 underline text-sm"
          >
            Sign Out
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* ENTITY LIST */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex justify-between mb-6 items-center">
            <h2 className="text-xl font-bold">Economic Entities</h2>

            <button
              onClick={() => navigate("/entities/new")}
              className="bg-black text-white px-4 py-2 rounded text-sm"
            >
              + Create Entity
            </button>
          </div>

          {entities.length === 0 ? (
            <p className="text-gray-500">You have not created any entities yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {entities.map((entity) => {
                const s = snapshots[entity.id] || {};

                return (
                  <div
                    key={entity.id}
                    onClick={() => navigate(`/entities/${entity.id}/overview`)}
                    className="border rounded-lg p-5 cursor-pointer hover:shadow-md transition"
                  >
                    <h3 className="font-semibold text-lg mb-2">{entity.name}</h3>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <Metric label="Events" value={s.event_count} />
                      <Metric label="Net Profit" value={s.net_profit} />
                      <Metric label="Assets" value={s.total_assets} />
                      <Metric label="Liabilities" value={s.total_liabilities} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
