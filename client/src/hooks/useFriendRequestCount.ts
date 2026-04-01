import { useEffect, useState } from "react";
import { getPendingRequests } from "../services/friendsService";
import useAuth from "../hooks/useAuth";

export default function useFriendRequestCount() {
  const auth = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchCount = () => {
      getPendingRequests(auth).then((res) => {
        if (!mounted) return;
        if (Array.isArray(res)) {
          setCount(res.length);
        } else {
          setCount(0);
        }
      });
    };

    fetchCount();
    const interval = setInterval(fetchCount, 1000); // poll every 1 second

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [auth]);

  return count;
}
