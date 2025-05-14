# World of Code (WoC) Getting Started

## Important Links

1. [WoC Registration Form](https://docs.google.com/forms/d/e/1FAIpQLSd4vA5Exr-pgySRHX_NWqLz9VTV2DB6XMlR-gue_CQm51qLOQ/viewform?vc=0&c=0&w=1&flr=0&usp=mail_form_link): To request access to our servers

2. [WoC Structure and Its Elements Video](https://youtu.be/c0uFPwT5SZI)

3. [Tutorial Recording from 2022-10-27](https://drive.google.com/file/d/1ytzOiOSgMpqOUm2XQJhhOUAxu0AAF_OH/view?usp=sharing) and [Older Tutorial Recoding (possibly obsolete) from 2019-10-15](https://drive.google.com/file/d/14tAx2GQamR4GIxOc3EzUXl7eyPKRx2oU/view?usp=sharing)

4. [WoC Discord](https://discord.gg/fKPFxzWqZX): Get updates or ask questions related to WoC

## Additional Resources

1. [WoC Shell Guide](https://github.com/woc-hack/tutorial/blob/master/ShellGuide.md): A brief guide on how to use bash and other related tools

2. [Unix Tools: Data, Software and Production Engineering](https://courses.edx.org/courses/course-v1:DelftX+UnixTx+1T2020/course/): Consider auditing this Massive Open Online Course (MOOC) if you are not comfortable working in the terminal or working with shell scripting

## Before You Start..

### Step 1. Requirements to Access the da Server(s)

To register for the hackathon/tutorial, please
generate a ssh public key. See instructions below.

For macOS and Unix users, the instructions below would work. Still, for Windows users, the best option is to enable [Ubuntu Shell](https://winaero.com/blog/how-to-enable-ubuntu-bash-in-windows-10) or [install Linux on Windows with WSL](https://docs.microsoft.com/en-us/windows/wsl/install-win10) first, then follow instructions for Unix/macOS.
Alternatively, you may use the [OpenSSH Module for PowerShell](https://www.techrepublic.com/blog/10-things/how-to-generate-ssh-keys-in-openssh-for-windows-10/) or [Git-Bash](https://docs.joyent.com/public-cloud/getting-started/ssh-keys/generating-an-ssh-key-manually/manually-generating-your-ssh-key-in-windows#Git-Bash) as an alternative option.

To generate a ssh key, open a terminal window and run the `ssh-keygen` command. Once completed, it produces the `id_rsa.pub` and `id_rsa` files inside your $HOME/.ssh/ folder.
To view the newly generated _public key_, type:

```
cat ~/.ssh/id_rsa.pub
```

You will need to provide this ssh _public key_ when you complete the **WoC Registration Form** (step 3), as the form will ask you for the contents of `id_rsa.pub` and your **GitHub** and **Bitbucket** handles (step 2). You will receive a response to the email you provide in the form once your account is set up (more details below).

Set up your `~/.ssh/config` file so that you can log in to one of the da servers without having to fully specify the server name each time:

```
Host *
  ForwardAgent yes

Host da0
	Hostname da0.eecs.utk.edu
	Port 22
	User YourUsername
```

Please note that access to the remaining servers is similarly available. da2 and da3 have ssh port 22 (both are running the worldofcode.org web server on the https port 443)

_Your_UserName_ is the login name you provided on the signup form. With the config setup, logging in becomes as simple as typing `ssh da0` in your terminal.

### Step 2. GitHub and Bitbucket Accounts Setup

If you dont have these already, please set up an account on both
GitHub and Bitbucket (these will be needed to invite you to the
relevant repositories on GitHub & Bitbucket).

- [GitHub Sign-up](https://github.com/pricing)
- [Bitbucket Sign-up](https://bitbucket.org/account/signup/)

### Step 3. Request for Access

Users may access our systems/servers by obtaining a WoC account. You may do so by registering for an account through the [WoC Registration Form](https://docs.google.com/forms/d/e/1FAIpQLSd4vA5Exr-pgySRHX_NWqLz9VTV2DB6XMlR-gue_CQm51qLOQ/viewform?vc=0&c=0&w=1&flr=0&usp=mail_form_link). We strive to provide access to new users the same day you fill out the form, but in the worst-case scenario, please allow up to 1 day for the account creation.

## Tutorial Objectives

Prepare for the hackathon or perform research, make sure connections work, get familiar with the basic functionality and potential of WoC, and start thinking about how to investigate global relationships in open source.

## Activity 1: Access to da Server(s)

Log in: `ssh da0`.

Once you are in a da server, you will have an empty directory under `/home/username` where you can store your programs and files:

```bash
-bash-4.2$ pwd
/home/username
-bash-4.2$
```

Set up your shell:

```bash
-bash-4.2$ echo 'exec bash' >> .profile
-bash-4.2$ echo 'export PS1="\u@\h:\w>"' >> ~/.bashrc
-bash-4.2$ . .bashrc
[username@da0]~%
```

You can also login to other da servers, but first need to set up an ssh key on these systems:

```bash
[username@da0]~% ssh-keygen
Generating public/private rsa key pair.
Enter file in which to save the key (/home/niravajmeri/.ssh/id_rsa):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /home/niravajmeri/.ssh/id_rsa.
Your public key has been saved in /home/niravajmeri/.ssh/id_rsa.pub.
The key fingerprint is:
SHA256:/UoJkpnx5mn8jx4BhcnQRUFfPq4qmC1MVLRJSjpYnpo niravajmeri@da0.eecs.utk.edu
The key's randomart image is:
+---[RSA 2048]----+
|    . o=o**.  .  |
|   + + o*+ . o   |
|  . = o.+   . o  |
|   o ..* o   . . |
|  E  .= S o   .  |
|      .= o + .   |
|     o += + o    |
|      =.oo =     |
|       . o*..    |
+----[SHA256]-----+
```

Once the key is generated add it to your .ssh/auhorized_keys

```bash
[username@da0]~% cat .ssh/id_rsa.pub >> .ssh/authorized_keys
```

Now you can login to da4:

```bash
[username@da0]~% ssh da4
[username@da4]~%
```

### Exercise 1

Log in to da0 and clone two repositories that contain APIs to access WoC data

```bash
[username@da0]~% git clone https://bitbucket.org/swsc/lookup
[username@da0]~% git clone https://github.com/ssc-oscar/python-woc
```

* **Note:** Make sure to access these directories and execute a `git pull` **frequently** to ensure you are working with latest updates.

Log in to da4 from da0:

```bash
[username@da0]~% ssh da4
[username@da4]~% ls
...
[username@da4]~% exit
[username@da0]~%
```
## Tutorials

World of Code provides four main tools for exploring its dataset: a MongoDB interface for aggregated metadata, a Python API for flexible scripted access, a web-based guide for interactive documentation and remote usage, and a shell-based API for low-level queries.

* **Tutorial(Mongo):** Provides instructions for querying WoC metadata through MongoDB, useful for high-level analysis of authors, projects, and APIs based on precomputed statistical summaries.
* **Tutorial(Python):** A set of Python APIs to WoC data including get_values for direct key-value queries, show_content for raw object content, and objects for a higher-level, cached, and more intuitive access pattern.
* **Tutorial(Remote):** Explains how to access WoC data and services from outside the WoC servers, including remote API interaction and data download options.
* **Tutorial(Shell):** A walkthrough for using shell-based lookup commands to explore low-level Git object relationships (commits, trees, blobs, authors, projects) stored in WoC.

## Disclaimers

_World of Code stores commits of a project that might never have ended up to appear in the source code of a project. For example, commits that are part of a pull request on GitHub that has never been merged are still part of the repository although they never have ended up in the project's codebase. This also holds for individual commits of squash-merged pull requests or interactively rebased commits: git stores all versions of these commits even if they don't end up in the codebase only in their final version. As World of Code uses `git clone --mirror`, it extracts all of such commits that don't end up in the project's codebase, which could for instance lead to counting the same blob multiple times or tracking unmerged blobs belonging to low-quality garbage pull requests of unrelated developers. Users of World of Code should be aware of that when accessing and analyzing the commits of a project._

_As many forks of GitHub projects appear to be just vehicles for pull requests instead of actual forks, World of Code has stopped discovering forks and updating their data around 2021 for convenience reasons, as a huge number of commits would have been stored multiple times in numerous of these forks. Therefore, the WoC database might be inconsistent with respect to such forks: Forks that have been existing before 2021 are part of World of Code, but no updates to these repositories (i.e., new commits) have been tracked for them after this point in time. In contrast, forks that have been created after WoC has stopped discovering forks won't show up in the WoC data at all._