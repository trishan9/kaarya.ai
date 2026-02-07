import { redirect } from "next/navigation";
import {
  completeOAuthLink,
  exchangeOAuthResult,
} from "@/lib/actions/auth-action";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function OAuthCallbackPage({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}) {
  const params = await searchParams;
  const resultToken = getFirstParam(params.oauth_result_token);
  const pendingLinkToken = getFirstParam(params.linkToken);

  if (!resultToken) {
    return redirect("/sign-in?oauthError=invalid_request");
  }

  const response = await exchangeOAuthResult(resultToken);
  if (!response?.success) {
    return redirect("/sign-in?oauthError=unavailable");
  }

  const result = response.data as
    | {
        status?: "authenticated";
        accessToken?: string;
      }
    | {
        status?: "link_required";
        linkToken?: string;
        provider?: string;
      }
    | {
        status?: "error";
        message?: string;
      };

  if (result?.status === "authenticated" && result.accessToken) {
    let sessionToken = result.accessToken;

    if (pendingLinkToken) {
      const linkResponse = await completeOAuthLink(pendingLinkToken);
      const linkedToken = linkResponse?.data?.accessToken;
      if (!linkResponse?.success || !linkedToken) {
        return redirect("/sign-in?oauthError=link_failed");
      }
      sessionToken = linkedToken;
    }

    const finalizeParams = new URLSearchParams({
      token: sessionToken,
      next: "/overview",
    });
    return redirect(`/oauth/finalize?${finalizeParams.toString()}`);
  }

  if (result?.status === "link_required" && result.linkToken) {
    const provider = result.provider ?? "";
    return redirect(
      `/sign-in?linkToken=${encodeURIComponent(
        result.linkToken
      )}&provider=${encodeURIComponent(provider)}`
    );
  }

  const errorCode =
    result?.status === "error" && result.message
      ? encodeURIComponent(result.message)
      : "oauth_error";
  return redirect(`/sign-in?oauthError=${errorCode}`);
}
