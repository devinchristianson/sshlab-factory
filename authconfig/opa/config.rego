package authconfig.config

import future.keywords.contains
import future.keywords.every
import future.keywords.if

import data.authconfig.helpers
import data.authconfig.shared

# merging all the configurations together, add env USERNAME=$username and bind /tmp/$username:/root
config := helpers.append_patch(
	helpers.append_patchs(
		object.union_n([
			data.environments[shared.environment], 
            object.union_n([config_obj | config_obj = object.filter(data.groups, shared.groups)[_].overrides]),
            {"docker": {"execution": {
				"container": {},
				"host": {},
			}}},
		]),
		"docker/execution/container/env", [
                        concat(
			        "=",
			        ["USERNAME", shared.username],
		        ),
                        concat(
			        "=",
			        ["ENVIRONMENT", shared.environment],
		        )
                ],
	),
	"docker/execution/host/binds", concat(
		"",
		[concat("-", ["lab", shared.environment, shared.username]), ":/root"],
	),
)
# just pass through all the metadata etc
authenticatedUsername := shared.username
metadata := input.metadata
environment := input.environment
files := input.files