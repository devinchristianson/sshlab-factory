package authconfig.shared
import future.keywords.contains
import future.keywords.every
import future.keywords.if


# for simplicity, right now the environment is required
username := split(input.username, "/")[0]

environment := split(input.username, "/")[1]

# determining what groups the user is in that allow access to the requested environment
groups contains group if {
        some group
        username in data.groups[group].members
        glob.match(data.groups[group].environments[_], [], environment)
}