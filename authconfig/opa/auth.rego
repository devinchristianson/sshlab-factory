package authconfig.auth

import future.keywords.contains
import future.keywords.every
import future.keywords.if

import data.authconfig.shared

# we don't support password auth at all
password.success := false

# default to denying pubkey auth
default pubkey.success := false

# if the user has at least one matching group, look up github keys and compare to the provided key
pubkey.success if {
        count(shared.groups) != 0

        # pull github keys from github
        github_keys := http.send({
                "method": "get",
                "url": concat(
                        "",
                        ["https://github.com/", shared.username, ".keys"],
                ),
                "headers": {"User-Agent": "OpenPolicyAgent-ContainerSSH-AuthConfig"},
        })

        # check if pubkey is in list from github
        input.publicKey in split(github_keys.raw_body, "\n")
}