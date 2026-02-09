"use client";

import {
  useMemo,
  useState,
  useTransition,
  type ComponentType,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Chrome,
  Github,
  Loader2,
  Mail,
  Plug,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOAuthLinkAuthorizeUrl,
  unlinkOAuthAccount,
} from "@/lib/actions/auth-action";
import { AuthProvider, TLinkedAccount, TUser } from "@/lib/definitions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const providerOrder: AuthProvider[] = ["email", "google", "github"];

const providerMetadata: Record<
  AuthProvider,
  {
    label: string;
    Icon: ComponentType<{ className?: string }>;
  }
> = {
  email: { label: "Email", Icon: Mail },
  google: { label: "Google", Icon: Chrome },
  github: { label: "GitHub", Icon: Github },
};

type LinkedAccountsSettingsProps = {
  user: TUser;
};

type OAuthProvider = Extract<AuthProvider, "google" | "github">;
type ConfirmAction = {
  provider: OAuthProvider;
  type: "link" | "unlink";
};

const formatDate = (value?: string | null) => {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Never";
  return parsed.toLocaleDateString();
};

export function LinkedAccountsSettings({ user }: LinkedAccountsSettingsProps) {
  const router = useRouter();
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(
    null
  );
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const linkedAccountMap = useMemo(() => {
    const map = new Map<AuthProvider, TLinkedAccount>();
    for (const account of user.linkedAccounts ?? []) {
      map.set(account.provider, account);
    }
    return map;
  }, [user.linkedAccounts]);

  const linkedProviders = useMemo(() => {
    const values = new Set<AuthProvider>(user.linkedProviders ?? []);
    if (user.provider) values.add(user.provider);
    for (const account of user.linkedAccounts ?? []) {
      values.add(account.provider);
    }
    return values;
  }, [user.linkedAccounts, user.linkedProviders, user.provider]);

  const handleLink = (provider: OAuthProvider) => {
    startTransition(async () => {
      setPendingProvider(provider);
      const response = await getOAuthLinkAuthorizeUrl(provider, "/settings");
      const authorizeUrl = response?.data?.authorizeUrl;

      if (!response?.success || !authorizeUrl) {
        toast.error(response?.message || "Unable to start account linking.");
        setPendingProvider(null);
        return;
      }

      setConfirmAction(null);
      window.location.assign(authorizeUrl);
    });
  };

  const handleUnlink = (provider: OAuthProvider) => {
    startTransition(async () => {
      setPendingProvider(provider);
      const response = await unlinkOAuthAccount(provider);

      if (!response?.success) {
        toast.error(response?.message || "Unable to unlink this account.");
        setPendingProvider(null);
        return;
      }

      toast.success(response?.message || "Account unlinked successfully.");
      router.refresh();
      setConfirmAction(null);
      setPendingProvider(null);
    });
  };

  const handleConfirmAction = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!confirmAction) return;
    if (confirmAction.type === "link") {
      handleLink(confirmAction.provider);
      return;
    }
    handleUnlink(confirmAction.provider);
  };

  const closeConfirmDialog = () => {
    if (isPending) return;
    setConfirmAction(null);
  };

  const isConfirmBusy = Boolean(
    confirmAction && isPending && pendingProvider === confirmAction.provider
  );
  const confirmLabel = confirmAction
    ? providerMetadata[confirmAction.provider].label
    : "selected";
  const isLinkAction = confirmAction?.type === "link";

  return (
    <>
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
          <CardDescription>
            Connect social providers for faster sign-in and manage linked
            identities.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {providerOrder.map((provider) => {
            const account = linkedAccountMap.get(provider);
            const isLinked = linkedProviders.has(provider);
            const isBusy = isPending && pendingProvider === provider;
            const isPrimary = user.provider === provider;
            const { Icon, label } = providerMetadata[provider];

            return (
              <div
                key={provider}
                className="rounded-xl border bg-muted/20 p-3 sm:p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">{label}</span>
                      <Badge variant={isLinked ? "secondary" : "outline"}>
                        {isLinked ? "Linked" : "Not linked"}
                      </Badge>
                      {isPrimary ? <Badge variant="outline">Primary</Badge> : null}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {account?.email ||
                        (provider === "email" ? user.email : null) ||
                        "No email data"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last used: {formatDate(account?.lastLoginAt)}
                    </p>
                  </div>

                  {provider === "email" ? (
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Email credentials are managed in your profile.
                    </div>
                  ) : isLinked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      className="gap-2"
                      onClick={() =>
                        setConfirmAction({ provider, type: "unlink" })
                      }
                    >
                      {isBusy ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Unlinking...
                        </>
                      ) : (
                        <>
                          <Unplug className="h-4 w-4" />
                          Unlink
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isBusy}
                      className="gap-2"
                      onClick={() => setConfirmAction({ provider, type: "link" })}
                    >
                      {isBusy ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Linking...
                        </>
                      ) : (
                        <>
                          <Plug className="h-4 w-4" />
                          Link
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) {
            closeConfirmDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isLinkAction
                ? `Link ${confirmLabel} account?`
                : `Unlink ${confirmLabel} account?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isLinkAction
                ? `You will be redirected to ${confirmLabel} to complete authorization.`
                : `This will remove ${confirmLabel} as a sign-in option for your account.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirmBusy}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isConfirmBusy}
              className={
                isLinkAction
                  ? undefined
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {isConfirmBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLinkAction ? "Starting..." : "Unlinking..."}
                </>
              ) : isLinkAction ? (
                "Confirm Link"
              ) : (
                "Confirm Unlink"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
