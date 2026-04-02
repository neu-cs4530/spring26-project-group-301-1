import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { DirectMessageInfo } from "@gamenite/shared";
import useLoginContext from "../hooks/useLoginContext.ts";
import { getDirectMessages } from "../services/dmService.ts";
import DirectMessagePanel from "../components/DirectMessagePanel.tsx";

export default function DirectMessage() {
  const { dmId } = useParams<{ dmId: string }>();
  const { user } = useLoginContext();
  const [dm, setDm] = useState<DirectMessageInfo | null>(null);

  useEffect(() => {
    if (!dmId) return;
    void getDirectMessages(user.username).then((result) => {
      if ("error" in result) return;
      setDm(result.find((d) => d.dmId === dmId) ?? null);
    });
  }, [dmId, user.username]);

  return dm ? (
    <>
      <h2>{dm.otherUser.display}</h2>
      <DirectMessagePanel dm={dm} />
    </>
  ) : (
    <p>Loading...</p>
  );
}
