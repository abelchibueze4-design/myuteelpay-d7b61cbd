import { useState } from "react";
import { useKvdataQuery } from "@/hooks/useKvdata";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const actions = [
  { label: "Data Plans", action: "get_data_plans" },
  { label: "Cable Plans", action: "get_cable_plans" },
  { label: "Edu Plans", action: "get_edu_plans" },
  { label: "Datacard Plans", action: "get_datacard_plans" },
  { label: "SMS Price", action: "get_sms_price" },
  { label: "Electricity Discos", action: "get_electricity_discos" },
];

const DebugKVData = () => {
  const [selectedAction, setSelectedAction] = useState(actions[0].action);
  const { data, isLoading, error, refetch } = useKvdataQuery({ action: selectedAction });

  return (
    <div className="min-h-screen bg-secondary p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">KVData API Debug</h1>
            <p className="text-muted-foreground text-sm font-medium">Inspect real-time responses from KVData endpoints.</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-2">
            Refresh Data
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 rounded-3xl border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Select Endpoint</CardTitle>
              <CardDescription>Choose an action to test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {actions.map((item) => (
                  <button
                    key={item.action}
                    onClick={() => setSelectedAction(item.action)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                      selectedAction === item.action
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        : "bg-background text-muted-foreground border-transparent hover:border-primary/30"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 rounded-3xl border-2 shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  <CardTitle className="text-lg">Response Body</CardTitle>
                </div>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : error ? (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-[#1e1e1e] p-6 font-mono text-xs overflow-auto max-h-[600px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p>Fetching data from KVData...</p>
                  </div>
                ) : error ? (
                  <div className="text-destructive">
                    <p className="font-bold mb-2">// Error occurred:</p>
                    <pre>{JSON.stringify(error, null, 2)}</pre>
                  </div>
                ) : (
                  <pre className="text-green-400">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DebugKVData;
