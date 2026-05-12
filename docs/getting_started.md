# World of Code (WoC) Getting Started

Start with the [current tutorial](tutorial.md) for the maintained setup and walkthrough. For what WoC can do and why it matters, see [What WoC Can Do](capabilities.md).

## Important Links

1. [Current Tutorial](tutorial.md)
2. [WoC Registration Form](https://docs.google.com/forms/d/e/1FAIpQLSd4vA5Exr-pgySRHX_NWqLz9VTV2DB6XMlR-gue_CQm51qLOQ/viewform?vc=0&c=0&w=1&flr=0&usp=mail_form_link): Request access to the servers
3. [WoC Structure and Its Elements Video](https://youtu.be/c0uFPwT5SZI)
4. [Tutorial Recording from 2022-10-27](https://drive.google.com/file/d/1ytzOiOSgMpqOUm2XQJhhOUAxu0AAF_OH/view?usp=sharing) and [Older Tutorial Recording from 2019-10-15](https://drive.google.com/file/d/14tAx2GQamR4GIxOc3EzUXl7eyPKRx2oU/view?usp=sharing)
5. [WoC Discord](https://discord.gg/fKPFxzWqZX): Get updates or ask questions related to WoC

## Additional Resources

1. [WoC Shell Guide](https://github.com/woc-hack/tutorial/blob/master/ShellGuide.md): A brief guide on how to use bash and related tools
2. [Unix Tools: Data, Software and Production Engineering](https://courses.edx.org/courses/course-v1:DelftX+UnixTx+1T2020/course/): Consider auditing this MOOC if you are not comfortable working in the terminal or shell scripting

## External References

- [Lookup command reference](https://bitbucket.org/swsc/lookup/src/master/README.md) — canonical map/command documentation
- [Overview repository](https://bitbucket.org/swsc/overview/) — version history, publications, and project status
- [Python driver documentation](https://ssc-oscar.github.io/python-woc/)
- [API documentation](https://wocapi-preview.osslab-pku.org/docs)

## Before You Start

The current access, SSH, and repository setup steps are maintained in [Part A of the tutorial](tutorial.md#part-a----setup). Use that page for the up-to-date onboarding flow.

## Tutorial Objectives

Prepare for the hackathon or perform research, make sure connections work, get familiar with the basic functionality and potential of WoC, and start thinking about how to investigate global relationships in open source.

## Supplemental and Legacy Pages

- [Map type inventory](map-types.md)
- [Old material from the tutorial](old_stuff.md)
- [Mongo guide](guide_mongo.md)
- [Remote guide](guide_remote.md)
- [Mappings and objects](maps.md)
- [Legacy shell tutorial](tutorial_legacy.md)

## Disclaimers

_World of Code stores commits of a project that might never have ended up to appear in the source code of a project. For example, commits that are part of a pull request on GitHub that has never been merged are still part of the repository although they never have ended up in the project's codebase. This also holds for individual commits of squash-merged pull requests or interactively rebased commits: git stores all versions of these commits even if they don't end up in the codebase only in their final version. As World of Code uses `git clone --mirror`, it extracts all of such commits that don't end up in the project's codebase, which could for instance lead to counting the same blob multiple times or tracking unmerged blobs belonging to low-quality garbage pull requests of unrelated developers. Users of World of Code should be aware of that when accessing and analyzing the commits of a project._

_As many forks of GitHub projects appear to be just vehicles for pull requests instead of actual forks, World of Code has stopped discovering forks and updating their data around 2021 for convenience reasons, as a huge number of commits would have been stored multiple times in numerous of these forks. Therefore, the WoC database might be inconsistent with respect to such forks: Forks that have been existing before 2021 are part of World of Code, but no updates to these repositories (i.e., new commits) have been tracked for them after this point in time. In contrast, forks that have been created after WoC has stopped discovering forks won't show up in the WoC data at all._
