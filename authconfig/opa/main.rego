package containerssh

import future.keywords.contains
import future.keywords.every
import future.keywords.if

# we don't support password auth at all
auth.password.success := false

# default to denying pubkey auth
default auth.pubkey.success := false

# for simplicity, right now the environment is required
username := split(input.username, "/")[0]

environment := split(input.username, "/")[1]

# determining what groups the user is in that allow access to the requested environment
groups contains group if {
        some group
        username in data.groups[group].members
        glob.match(data.groups[group].environments[_], [], environment)
}

# if the user has at least one matching group, look up github keys and compare to the provided key
auth.pubkey.success if {
        count(groups) != 0

        # pull github keys from github
        github_keys := http.send({
                "method": "get",
                "url": concat(
                        "",
                        ["https://github.com/", username, ".keys"],
                ),
                "headers": {"User-Agent": "OpenPolicyAgent-ContainerSSH-AuthConfig"},
        })

        # check if pubkey is in list from github
        input.publicKey in split(github_keys.raw_body, "\n")
}
user_specific_config := {
        "docker": {
                "execution": {
                        "container": {
                                "env": [
                                        concat(
                                                "",
                                                ["USERNAME=",username]
                                        )
                                ]
                        }
                }
        }
}

# building a list of all overrides
overrides := [config_obj | config_obj = object.filter(data.groups, groups)[_].overrides]
# merging all the configurations together, passing to the user
config.config := object.union_n([data.environments[environment], object.union_n(overrides),user_specific_config])
config.metadata := input.metadata
config.environment := input.environment
config.files := input.files