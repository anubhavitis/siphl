"use client";

import {
  useUserSIPs,
  useCancelSIP,
  usePauseSIP,
  useResumeSIP,
} from "@/lib/hyperliquid/hooks-sip";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Pause, Play } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function SIPList() {
  const { data: sips, isLoading } = useUserSIPs();
  const { mutate: cancelSIP, isPending: isCancelling } = useCancelSIP();
  const { mutate: pauseSIP, isPending: isPausing } = usePauseSIP();
  const { mutate: resumeSIP, isPending: isResuming } = useResumeSIP();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sips || sips.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-8">
        <p className="text-center text-muted-foreground text-sm">
          No SIPs yet. Create your first systematic investment plan!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="py-2 h-auto">Asset</TableHead>
            <TableHead className="py-2 h-auto">Monthly Amount</TableHead>
            <TableHead className="py-2 h-auto">Status</TableHead>
            <TableHead className="py-2 h-auto">Created</TableHead>
            <TableHead className="text-right py-2 h-auto">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sips.map((sip: any) => (
            <TableRow key={sip.id}>
              <TableCell className="font-medium py-2">
                <a
                  href={`https://app.hyperliquid.xyz/trade/${sip.asset_name.startsWith("U") ? sip.asset_name.slice(1) : sip.asset_name}/USDC`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {sip.asset_name}
                </a>
              </TableCell>
              <TableCell className="py-2">
                {sip.monthly_amount_usdc} USDC
              </TableCell>
              <TableCell className="py-2">
                {sip.status === "active" ? (
                  <Badge variant="default">Active</Badge>
                ) : (
                  <Badge variant="secondary">Paused</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm py-2">
                {new Date(sip.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right py-2">
                <div className="flex justify-end gap-2">
                  {sip.status === "active" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => pauseSIP(sip.id)}
                        disabled={isPausing}
                      >
                        {isPausing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Pause className="h-4 w-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isCancelling}
                          >
                            {isCancelling ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel SIP?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel this SIP for{" "}
                              {sip.asset_name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No, keep it</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelSIP(sip.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Yes, cancel SIP
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                  {sip.status === "paused" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resumeSIP(sip.id)}
                        disabled={isResuming}
                      >
                        {isResuming ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isCancelling}
                          >
                            {isCancelling ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel SIP?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel this SIP for{" "}
                              {sip.asset_name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No, keep it</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelSIP(sip.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Yes, cancel SIP
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
