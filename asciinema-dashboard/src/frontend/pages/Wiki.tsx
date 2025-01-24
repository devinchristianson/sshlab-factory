import { useEffect, useState } from "react";
import {useParams} from "react-router-dom"
import Markdown from "../components/Markdown";
function Wiki() {
  const identifier = useParams().identifier;
  const [isError, setError] = useState<boolean>(false)
  const [src, setSrc] = useState("")
  useEffect(() => {
    if (identifier) {
      fetch(`/markdown/${identifier}`)
      .then((resp) => {
        if (resp.ok) {
          return resp.text()
        } else {
          setError(true)
        }
      })
      .then((text) => {
        setSrc(text ?? '')
      })
      .catch(() => {
        setError(true)
      })
    }
  }, [identifier])
  if (isError) {
    <div>Oops!</div>
  }
  return (
    <Markdown src={src}/>
  );
}

export default Wiki;