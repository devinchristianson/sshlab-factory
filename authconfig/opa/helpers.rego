package authconfig.helpers
import future.keywords.contains
import future.keywords.every
import future.keywords.if

# some helper functions
ensure_array(o, p) := json.patch(o, [{"op": "add", "path": p, "value": []}]) if {
	not is_array(object.get(o, split(p, "/"), false))
} else := o

append_patchs(o, p, v) := json.patch(
        ensure_array(o, p), [{"op": "add", "path": concat("/", [p, "-"]), "value": value } | value := v[i]]
)
append_patch(o,p,v) := append_patchs(o,p,[v])