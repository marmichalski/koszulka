// Default action inputs, same as in action.yml. The modules read the inputs when they are imported.
process.env.INPUT_TOKEN = "token";
process.env.INPUT_IGNORELINEDELETIONS = "false";
process.env.INPUT_IGNOREFILEREMOVALS = "false";
process.env.INPUT_IGNOREFILES = "";
process.env.INPUT_LABELS = "size/xs\nsize/s\nsize/m\nsize/l\nsize/xl";
process.env.INPUT_LABELSSIZES = "10\n100\n500\n1000";
process.env.INPUT_COMMENTONLASTSIZE = "false";
process.env.INPUT_COMMENTCONTENTONLASTSIZE = "This PR is quite large.";
process.env.INPUT_FAILONLASTSIZE = "false";
process.env.GITHUB_REPOSITORY = "owner/repo";
