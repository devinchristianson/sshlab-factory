## Steps
1. Apply the demo manifest
   - `kubectl apply -f manifest.yml`
2. Watch the pod be created with
   - `kubectl get pods -w`
3. Check out the ingress object that got created
   - `kubectl get ingress`

Subsequent changes can be re-applied with `kubectl apply -f manifest.yml`

## Tasks:
1. Make the deployment run two echo pods
    <details>
    <summary>Hint 1</summary>
        Update the `replicas` key on the deployment to `2`
    </details>
2. Make the ingress require path `/echo`
   <details>
    <summary>Hint 1</summary>
        The path type is already `prefix` so all thats needed is to update the path to `/echo`
    </details>
3. The `hashicorp/http-echo` image's entrypoint can take a command line flag to specify a custom string to print, e.g. `-text=banana`. Modify the deployment to print out a custom message and test it out!
    <details>
    <summary>Hint 1</summary>
        Kubectl explain can be used to reference the fields on an object, though the output is usually long so you can pipe into `less`, e.g. `kubectl explain pods.spec.containers | less`
    </details>
    <details>
    <summary>Hint 2</summary>
        You need to add `args` to the container definition, e.g.
        ```containers:
        - name: echo
          image: hashicorp/http-echo
          args:
            - "-text=banana"
        ```
        then simply re-apply the manifest
    </details>