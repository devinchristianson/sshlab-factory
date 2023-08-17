package containerssh
import future.keywords.if
import future.keywords.contains
import future.keywords.every

# we don't support password auth at all
auth.password.success = false

# default to denying pubkey auth
default auth.pubkey.success = false

# for simplicity, right now the environment is required
username := split(input.username, "/")[0]
environment := split(input.username, "/")[1]

# determining what groups the user is in that allow access to the requested environment
groups contains group if {
	    username == data.groups[group].members[_]
	    environment == data.groups[group].environments[_]
}

# if the user has at least one matching group, look up github keys and compare to the provided key
auth.pubkey.success = true {
    count(groups) != 0
    # pull github keys from github
    githubKeys := http.send({"method": "get", "url": concat("", ["https://github.com/",username,".keys"]), "headers": {"User-Agent": "OpenPolicyAgent-ContainerSSH-AuthConfig"}})
    # check if pubkey is in list from github
    input.publicKey == split(githubKeys.raw_body,"\n")[_]
}

# building a list of all overrides
overrides := [config | config = object.filter(data.groups, groups)[_].overrides]

# merging all the configurations together, passing to the user
auth.config.config := object.union(data.environments[environment], object.union_n(overrides))