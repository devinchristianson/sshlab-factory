import * as React from "react";
import { ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import { trpc } from "../utils";


function TOTP() {
  const { data, refetch } = trpc.getTotp.useQuery()
  const [timeUntilExpiry, setTimeUntilExpiry] = React.useState<number>()
  const animation = React.useRef<SVGAnimateElement>(null);
  React.useEffect(() => {
    if (data) {
      setTimeUntilExpiry((data.expires - Date.now()))
      animation.current?.beginElement() // play the animation
      setTimeout(refetch, timeUntilExpiry) // fetch new totp when this one expires
    }
  }, [data])
  const copyTotp = async () => {
    if (data) {
      await navigator.clipboard.writeText(data.otp)
    }
  }
  return (
    <div className="flex flex-row gap-2 grow">
      Copy OTP:
      <ClipboardDocumentIcon onClick={copyTotp} className="h-6 w-6 text-blue-500 cursor-pointer" />
      <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1" viewBox="30 30 140 140" preserveAspectRatio="none" style={{ width: 100, height: 100, top: 0, left: 0 }}>
        <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" stroke-width="25" stroke-dasharray="315,20000"
          transform="rotate(-90,100,100)" stroke-linecap="round">
          <animate ref={animation} repeatCount="1" restart="always" attributeName="stroke-dasharray"
            values="315,20000;0,20000" dur="(timeUntilExpiry && timeUntilExpiry > 0 ? (timeUntilExpiry / 1000) : 0)" />
        </circle>
      </svg>
    </div>
  );
}

export default TOTP;