# Tutorial basics for the Hackathon

-------

## Part A -- Setup

### Set up accounts for GitHub and Bitbucket

Work through this part in order:

1. create a GitHub account if you do not already have one
2. create a Bitbucket account if you do not already have one
3. generate an SSH key pair
4. submit the registration form with your account information and public key
5. wait until you are granted access to the servers and repositories
6. log in to a `da` server
7. clone the repositories you will use during the Hackathon

You will need to provide the following in the registration form:

* your GitHub handle
* your Bitbucket handle
* your preferred World of Code handle
* your public SSH key

GitHub: https://github.com/

BitBucket: https://bitbucket.org/account/signup/

Registration Form: https://docs.google.com/forms/d/1quBIozLEP-ApaTaREr5FIu0HhOKAc4A4WkQngmW8L2g/edit

--------

### Gaining access and permissions to the da server(s)

Access to the `da` servers is based on your public SSH key. Generate a key pair with `ssh-keygen` on your terminal. This will usually create `id_rsa` and `id_rsa.pub` inside your `~/.ssh/` directory. The `id_rsa.pub` file is the public key that you should submit in the registration form.

If you are on Windows, the easiest options are WSL, OpenSSH for PowerShell, or Git Bash; the rest of the steps are then the same.

To inspect the public key you need to submit, run:

```sh
cat ~/.ssh/id_rsa.pub
```

If you want a shorter login command, add a host entry to `~/.ssh/config`:

```
Host *
	ForwardAgent yes

Host da0
	Hostname da0.eecs.utk.edu
	Port 443
	User {username}
	IdentityFile ~/.ssh/id_rsa
```

After you submit the form, there may be a delay before your server access and repository invitations are ready.

Once access has been granted, log in in one of these two ways:

* if you added the `~/.ssh/config` entry above, run `ssh da0`
* otherwise, run `ssh -p443 username@da0.eecs.utk.edu`

Once you are connected to a da server, you will have an empty directory under `/home/username` where you can store your programs and files:

```
[username@da0]~% pwd
/home/username
[username@da0]~%
```

If you want to hop from `da0` to another `da` server such as `da4`, generate a key on `da0` as well and add it to `~/.ssh/authorized_keys` there:

```sh
ssh-keygen
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
ssh da4
```

---------

### Cloning useful repositories

The `python-woc` and `swsc/lookup` repositories are useful starting points for working with WoC, so it is a good idea to clone them into your home directory on a `da` server.

python-woc link: https://github.com/ssc-oscar/python-woc

swsc/lookup link: https://bitbucket.org/swsc/lookup/src/master/

Clone them with `git clone <link>` (without brackets). For example:

```sh
git clone https://github.com/ssc-oscar/python-woc.git
git clone https://bitbucket.org/swsc/lookup.git
```

Once they are cloned, it is a good idea to run `git pull` in these repos periodically so your local copies stay in sync with current API changes.

For more background on SSH keys, see https://confluence.atlassian.com/bitbucketserver/creating-ssh-keys-776639788.html.

-------

## Part B -- Architecture overview

### List of relevant directories

The folder structure on any server follows the following convention:

- Raw blobs (that is, the actual file contents of the git repositories) are located in files `/da5_data/All.blobs/{commit,tree,tag,blob}_Num.{idx,bin}` where `Num` is in `{0..127}`. These are appended to periodically as new objects are discovered and extracted.
- Folder `/da5_fast` is mounted on an array of striped SSDs so that the data can be read in parallel. The `da3` and `da4` servers have similar fast-storage setups. It contains maps such as `c2fFull$Ver.Num.tch` that index the blobs by features such as commit or file name. They are also backed up under `/da0_data/basemaps`.
- `/da5_fast` has subfolders `All.sha1`, `All.sha1c`, and `All.sha1o`.
  - `All.sha1` holds SHA1-to-record mappings such as `sha1.commit_0.tch`, `sha1.tree_0.tch`, `sha1.tag_0.tch`, and `sha1.blob_0.tch`. These map an object SHA1 to its logical record position in the raw object store, which tells you which object record to retrieve.
  - `All.sha1c` on `da5` contains direct content maps for non-blob objects, such as `commit_0.tch` and `tree_0.tch`; on this machine it also contains `tag_*` and `tkns_*` files.
  - `All.sha1o` contains files such as `sha1.blob_0.tch` that map a blob SHA1 to the numeric byte offset and object size needed to read that blob directly from `/da5_data/All.blobs/blob_Num.bin`.

Not all files are stored on all servers due to limited disk sizes and the different speed classes of storage; in this naming scheme, `fast` means SSD-backed random-access storage. The pathname usually tells you both what the data is and where it lives.

In order for SSDs to be fast they need to be mounted in parallel. For example, if `7ssds` is a volume group that has seven SSDs as physical volumes, logical volume `7ssds` can be created via:

```
lvcreate --extents 100%FREE --name 7ssds --stripes 7 --stripesize 256 7ssds
```

### Random-lookup maps

The relationship `.tch` files are stored in fast random-access locations such as `/da3_fast/`, `/da4_fast/`, and `/da5_fast/`, and also in basemap directories under `/da[0-8]_data/basemaps/`. On this machine, `/da0_data/basemaps`, `/da1_data/basemaps`, `/da2_data/basemaps`, `/da3_data/basemaps`, `/da4_data/basemaps`, `/da5_data/basemaps`, `/da7_data/basemaps`, and `/da8_data/basemaps` exist; `/da6_data/basemaps` is absent.

These maps are intended for random lookup rather than full scans: given a key, you retrieve the corresponding value directly. Conceptually they support a `getValue`-style lookup, and in this repo the command-line wrapper for that access pattern is `~/lookup/getValues`.

The same logical relationship often exists in multiple WoC versions, which is important for reproducibility. You will see version suffixes such as `S`, `T`, `U`, `V3`, `V2409`, `V2412`, and `V2510` in map names, and `getValues` can be told which version to use with its `-v` option.

The following relationship files are indexes that allow you to map different metadata values to each other; for example files `c2pc0.s` through `c2pc31.s` together constitute an index mapping commits to their parents. They contain all commits across all repositories in World of Code, so this is a very comprehensive index. The relationship `.tch` files are in TokyoCabinet format and are typically either a single file or a 32-shard family; this is also the layout expected by `~/lookup/getValues`.

A machine-generated inventory of relationship map types and their latest `.tch` and `.s` versions on this machine is available in [map-types.md](./map-types.md). In summary, many core relationship maps have recent `.tch` and `.s` versions side by side, while some map types exist only as flat `.s` files.

The sharded `.tch` names are in the form `<mapType>Full<version>[.<shard>].tch`, with `<shard>` in `0..31` when the map is sharded.

### Ordered-by-key flat files in `basemaps/gz/`

These flat files are the ordered-by-key source form for many relationship maps, and they include map types that may not yet have been converted to `.tch`. The flat `.s` files live in `/da[0-8]_data/basemaps/gz/` on servers that have basemap copies.

Their map type is the prefix before `Full`, for example `a2c`, `A2b`, `P2b`, `cnpOrUndef`, or `c2p`. After `Full` comes the WoC version, and then, for sharded maps, a shard number.

Newer dotted flat-file names use the form `<mapType>Full.<version>[.<shard>].s`.

Older single-letter versions use the form `<mapType>Full<version>[.<shard>].s`.

Examples:

* `A2aFullHT.s` - single flat file of type `A2a`
* `A2bFullU0.s` through `A2bFullU31.s` - 32 shards of type `A2b`
* `P2bFullU0.s` through `P2bFullU31.s` - 32 shards of type `P2b`
* `cnpOrUndefFullS.0.s` through `cnpOrUndefFullS.31.s` - 32 shards of type `cnpOrUndef`

On this machine, the flat `.s` files I found are a mix of single-file, `0..31`, and `0..127` layouts, depending on the map type. By contrast, the relationship `.tch` maps used by `getValues` are single-file or `0..31` families. The separate `All.sha1*` object-index families discussed above also use larger layouts, but those are not relationship maps.

In the following table, `(.s)` signifies that there are either `.s` or `.gz` versions of these flat files in a `gz/` subfolder; in practice you will usually read them with Python's `gzip` module or Unix `zcat`.

Key notation:

**Case convention:** lowercase letters usually denote raw entities, while uppercase letters denote aliased, normalized, or deduplicated entities.

| Symbol | Meaning |
|---|---|
| `a` / `A` | raw author / aliased author |
| `p` / `P` | raw project / aliased or normalized project |
| `b` | blob |
| `c` | commit |
| `f` | file |
| `h` | head commit |
| `pc` | parent commit |
| `cc` | child commit |
| `ta` | time and author |
| `trp` | Torvald path |

Longer prefixes such as `Pkg`, `tk`, `def`, `call`, `dat`, and similar derived forms extend this basic notation; see [map-types.md](./map-types.md) for the broader inventory.

A fuller inventory of relationship families is maintained in [map-types.md](./map-types.md), which is a better reference than a partial inline list.

When using `python-woc` or related lookup scripts, the `PATHS` dictionary or shell wrapper can point at either a fast-storage copy under `/da[345]_fast/` or a basemap copy under `/da[0-8]_data/basemaps/`, depending on which server has the version you need.

### Scratch space on a da server

Instead of creating new files from reading data in your home directory, you're allowed to have a scratch directory under `/data/play/<username>`. A distinct advantage of doing so is that you won't hit NFS limitations from high-throughput reading and writing in `/home/<username>`. Additionally, it is advised that you create your files on the same machine you're reading data from in order to avoid network latency and read errors.

#### `/data/play/$LANGthruMaps/`

These `thruMaps` directories contain mappings that list repositories and the modules they depended on, at a given Unix timestamp under a specific commit. The mappings are in `c2bPtaPkgO{$LANG}.{0-31}.gz` files.

Format: `commit;repo_name;timestamp;author;blob;module1;module2;...`

Each `thruMaps` directory has a different language (`$LANG`) that contains modules relevant to that language. Modules are typically libraries written in the same language and installed automatically through a repository manager. For example the Rust `thruMaps` list Rust-language projects and the crates they depend on and install through their build process from `http://crates.io`.

-------

## Part C -- Shell lookup commands and shell-first large-scale analysis

### Guided shell walkthrough with `showCnt` and `getValues`

For interactive shell work, the two main entry points are:

* `~/lookup/showCnt` for inspecting the stored content of commits, trees, and blobs
* `~/lookup/getValues` for traversing relationship maps by key

The examples below form a simple progression: inspect one commit, follow it to its tree and blob content, then pivot into relationship-map lookups built around the same objects and author.

#### 1. Start from a commit

Let's look at commit `009d7b6da9c4419fe96ffd1fffb2ee61fa61532a`:

```sh
echo 009d7b6da9c4419fe96ffd1fffb2ee61fa61532a | ~/lookup/showCnt commit 3
```

Output:

```text
tree 464ac950171f673d1e45e2134ac9a52eca422132
parent dddff9a89ddd7098a1625cafd3c9d1aa87474cc7
author Warner Losh <imp@FreeBSD.org> 1092638038 +0000
committer Warner Losh <imp@FreeBSD.org> 1092638038 +0000

Don't need to declare cbb module.  don't know why I never saw
duplicate messages..
```

This tells us the commit's root tree, parent commit, and author.

`showCnt commit` has several output modes. The ones most useful in shell pipelines are:

* `~/lookup/showCnt commit` or `commit 0` -> `commit;tree;parents;author;committer;author_time;committer_time`
* `~/lookup/showCnt commit 1` -> `commit;author_time;author`
* `~/lookup/showCnt commit 2` -> `commit;author;author_time;timezone;flattened_message`
* `~/lookup/showCnt commit 3` -> raw commit object, which is useful when you want to inspect the original headers and message
* `~/lookup/showCnt commit 5` -> `commit;parents`
* `~/lookup/showCnt commit 6` -> `commit;author_time;author_tz;author;tree;parents`
* `~/lookup/showCnt commit 7` -> `commit;base64_raw_commit`
* `~/lookup/showCnt commit 8` -> `commit;author_time;committer_time;author;committer;parents`
* `~/lookup/showCnt commit 9` -> `commit;tree;parents;author;committer;author_time;committer_time;author_tz;committer_tz;flattened_message`

For example:

```sh
echo 009d7b6da9c4419fe96ffd1fffb2ee61fa61532a | ~/lookup/showCnt commit 1
echo 009d7b6da9c4419fe96ffd1fffb2ee61fa61532a | ~/lookup/showCnt commit 5
```

Output:

```text
009d7b6da9c4419fe96ffd1fffb2ee61fa61532a;1092638038;Warner Losh <imp@FreeBSD.org>
009d7b6da9c4419fe96ffd1fffb2ee61fa61532a;dddff9a89ddd7098a1625cafd3c9d1aa87474cc7
```

#### 2. Inspect the root tree

Now inspect the tree and look at its first and last entries:

```sh
echo 464ac950171f673d1e45e2134ac9a52eca422132 | ~/lookup/showCnt tree | awk 'NR==1; END{print}'
```

Output:

```text
100644;a8fe822f075fa3d159a203adfa40c3f59d6dd999;COPYRIGHT
040000;6618176f9f37fa3e62f2efd953c07096f8ecf6db;usr.sbin
```

The first entry is a blob for the file `COPYRIGHT`.

For trees, the default output is one `mode;sha;name` entry per line. `~/lookup/showCnt tree 1` emits the whole tree on one semicolon-separated line, which can be useful for batch processing, and `~/lookup/showCnt tree 3` recursively expands subtrees.

#### 3. Inspect the blob content

We can inspect that blob directly and limit the output to two lines:

```sh
echo a8fe822f075fa3d159a203adfa40c3f59d6dd999 | ~/lookup/showCnt blob | head -n 2
```

Output:

```text
# $FreeBSD$
#	@(#)COPYRIGHT	8.2 (Berkeley) 3/21/94
```

If you want content on one line, `showCnt` also supports a compact mode:

```sh
echo a8fe822f075fa3d159a203adfa40c3f59d6dd999 | ~/lookup/showCnt blob 1
```

That produces a single-line, base64-encoded representation of the blob content.

For blobs, the main formats are:

* `~/lookup/showCnt blob` -> raw blob content
* `~/lookup/showCnt blob 1` -> `blob_sha;base64_content;rest`, which is the most useful format for batch extraction
* `~/lookup/showCnt blob 2` -> one output line per blob line as `content_line;blob_sha;rest`; semicolons in content are rewritten as `_SEMICOLON_`

If you are extracting many blobs, `blob 1` is usually the safest mode because each blob stays on a single output line and can be decoded later.

#### 4. Follow relationships with `getValues`

The same blob can now be used as a key in relationship maps. A good next step is to ask where that blob first appeared and then which projects contain it.

Start with `b2tac`, which maps a blob to time, author, and commit:

```sh
echo a8fe822f075fa3d159a203adfa40c3f59d6dd999 | ~/lookup/getValues b2tac | cut -d ';' -f1-4
```

Output:

```text
a8fe822f075fa3d159a203adfa40c3f59d6dd999;1072910122;Warner Losh <imp@FreeBSD.org>;121f970412fec7f9af0352a9b4ce8dca43bdb59e
```

Now take the commit column from `b2tac` and feed it to `c2p` to list projects containing that blob:

```sh
echo a8fe822f075fa3d159a203adfa40c3f59d6dd999 | \
  ~/lookup/getValues b2tac | \
  awk -F';' '{for(i=4;i<=NF;i+=3){print $i}}' | \
  ~/lookup/getValues -f c2p | \
  cut -d';' -f2 | \
  ~/lookup/lsort 100M -u | \
  head -n 5
```

Output:

```text
0cjs_unix-history-repo
0mp_freebsd
0xbda2d2f8_freebsd
0xffffffrabbit_freebsd-base-graphics
0xkag_freebsd
```

If you want to continue from the author, you can also follow author-alias relationships:

```sh
echo 'Warner Losh <imp@FreeBSD.org>' | ~/lookup/getValues a2A
echo 'imp <imp@bsdimp.com>' | ~/lookup/getValues A2a | tr ';' '\n' | head -n 3
```

Output:

```text
Warner Losh <imp@FreeBSD.org>;imp <imp@bsdimp.com>
imp <imp@bsdimp.com>
M. Warner Losh <imp@bsdimp.com>
M. Warner Losh <imp@freebsd.org>
```

And we can list commits by that author:

```sh
echo 'Warner Losh <imp@FreeBSD.org>' | ~/lookup/getValues a2c | tr ';' '\n' | head -n 4
echo 'Warner Losh <imp@FreeBSD.org>' | ~/lookup/getValues -f a2c | head -n 5
```

Output:

```text
Warner Losh <imp@FreeBSD.org>
0000ce4417bd8d9a2d66a7a61393558d503f2805
000109ae96e7132d90440c8fa12cb7df95a806c6
0001246ed9e02765dfc9044a1804c3c614d25dde

Warner Losh <imp@FreeBSD.org>;0000ce4417bd8d9a2d66a7a61393558d503f2805
Warner Losh <imp@FreeBSD.org>;000109ae96e7132d90440c8fa12cb7df95a806c6
Warner Losh <imp@FreeBSD.org>;0001246ed9e02765dfc9044a1804c3c614d25dde
Warner Losh <imp@FreeBSD.org>;00014b72bf10ad43ca437daf388d33c4fea73df9
Warner Losh <imp@FreeBSD.org>;000153916157b29a14b65fa3efeff4e3788e1b0e
```

Use the regular output form when you want all values on one line per key, and `-f` when you want a flat table with one key-value pair per line. `-f` is most useful for multi-value maps such as `a2c`, `c2p`, or `b2tac`; for single-value maps such as `b2fa` or `c2dat`, it mostly just breaks one logical record into separate output fields.

Also note that `getValues` uses only the first input column as the key and passes the remaining columns through unchanged. That is useful when you want to preserve context in a pipeline:

```sh
echo 'Warner Losh <imp@FreeBSD.org>;zz' | ~/lookup/getValues -f a2c | head -n 3
```

Output:

```text
Warner Losh <imp@FreeBSD.org>;zz;0000ce4417bd8d9a2d66a7a61393558d503f2805
Warner Losh <imp@FreeBSD.org>;zz;000109ae96e7132d90440c8fa12cb7df95a806c6
Warner Losh <imp@FreeBSD.org>;zz;0001246ed9e02765dfc9044a1804c3c614d25dde
```

#### 5. Batch keys when possible

When retrieving many objects or many map values, prefer one invocation with multiple keys on standard input rather than many separate calls. That keeps the lookup overhead lower and avoids repeated remote access work.

In particular, do **not** run `showCnt` or `getValues` once per key in a shell loop when you have many keys. Feed many keys to one process instead. Repeated one-key invocations generate unnecessary SSH traffic and can effectively DDoS the lookup service.

For very large exact-key workloads or full-map scans, especially once you get into hundreds of thousands of keys (roughly `500K+`), the flat sorted `.s` files plus shard-local `join` are often faster than repeated random lookups through `getValues`.

### Useful helpers for flat `.s` workflows

When you move from interactive lookups to bulk work on flat `.s` files, three helper tools are especially useful: `splitSec.perl`, `splitSecCh.perl`, and `lsort`.

#### `splitSec.perl` and `splitSecCh.perl`

These helpers split an input stream into shard-aligned gzip files so that later joins can be done shard by shard.

* `splitSec.perl` is for hash-like keys such as SHA1s; it computes the target shard from the first field using WoC's hash-based segmentation logic
* `splitSecCh.perl` is for non-hash keys such as project, author, or path strings; in the current implementation it also hashes the full first field with the same `sHash()` logic rather than routing by first byte

In `woc.pm`, `sHash()` uses `Digest::FNV::XS::fnv1a_32($v) & ($nseg - 1)`. In other words, WoC takes a 32-bit FNV-1a hash of the first field and, for power-of-two shard counts such as 32 or 128, maps it to a shard with a bit mask.

Their basic usage pattern is:

```sh
some_command_producing_key_value_lines | ~/lookup/splitSec.perl prefix. 128
some_command_producing_key_value_lines | ~/lookup/splitSecCh.perl prefix. 32
```

This creates files such as `prefix.0.gz`, `prefix.1.gz`, and so on. If you pass a third argument, the scripts print the shard number instead of writing files, which is useful for debugging.

As a rule of thumb:

* use `splitSec.perl` when the first field is a SHA1-like key
* use `splitSecCh.perl` when the first field is a regular string key but you still want the same stable hash-based partitioning used by WoC tooling

#### `lsort`

`~/lookup/lsort` is a thin wrapper around `sort` that sets `LC_ALL=C`, uses gzip for compressed temporary runs, and lets you control memory with a size argument such as `10G` or `500M`.

For large inputs, use `~/lookup/lsort`, not plain `sort`. The wrapper runs `sort -T.` so temporary files stay in the current working directory rather than the default temp area; plain `sort` can fill `/tmp` on large jobs and crash the server.

Typical usage:

```sh
... | ~/lookup/lsort 10G -t';' -k1,1
... | ~/lookup/lsort 10G -t';' -k1,4 -u
~/lookup/lsort 10G -t';' -k1,1 --merge <(zcat part1.s) <(zcat part2.s)
```

In practice, `lsort` is useful for:

* sorting shard files before `join`
* deduplicating records with `-u`
* merging already-sorted shard outputs with `--merge`

#### Split -> join -> merge in pure shell

For large jobs, keep the work in the shell as long as possible and follow the structure of the data:

1. split the work by shard (`0..31` or `0..127`)
2. filter or project each shard independently with streaming tools such as `zcat`, `grep`, `awk`, `cut`, and `~/lookup/lsort`
3. normalize each shard on the future join key
4. join shard-local intermediates
5. merge the derived outputs and reduce at the end

For example:

```sh
for i in $(seq 0 31); do
  zcat /data/play/PYthruMaps/c2bPtaPkgOPY.$i.gz | grep -w tensorflow \
    > /data/play/$USER/tensorflow.$i &
done
wait

for i in $(seq 0 31); do
  awk -F';' '{print $2 ";" $3}' /data/play/$USER/tensorflow.$i \
    | ~/lookup/lsort 1G -t';' -k1,1 -k2,2n \
    > /data/play/$USER/tensorflow.repo_time.$i &
done
wait

cat /data/play/$USER/tensorflow.repo_time.* \
  | ~/lookup/lsort 1G -t';' -k1,1 -k2,2n \
  | awk -F';' '!seen[$1]++' \
  > /data/play/$USER/tensorflow.first.shell
```

This split -> normalize -> merge pattern scales well because each shard is processed independently, only smaller derived files are carried forward, and the final reduction happens once at the end. If you have another shard-aligned input on the same key, prepare both sides with `~/lookup/lsort` and `join` them shard by shard before the final merge.

#### How this looks when building `.s` files

The `b2ob.slurm` workflow shows the general pattern used when creating or refreshing `.s` relationship files:

1. read existing `.s` or intermediate gzip inputs with `zcat`
2. transform records with `perl`/`awk`
3. sort and deduplicate with `~/lookup/lsort`
4. split by shard when building an inverted map
5. sort each shard again
6. merge shard families into final `Full.<version>.<shard>.s` outputs

Some representative examples from that workflow:

```sh
zcat $pVer${ver}.$i.gz | \
  perl ... | \
  $HOME/bin/lsort ${maxM}M -t\; -k1,4 -u | \
  gzip > ../../All.blobs/$pVer$ver.$i.s
```

```sh
done | perl -I $HOME/lib/perl5 -I $HOME/lookup $HOME/lookup/splitSec.perl bb2cf.$ver.$l. 128
```

```sh
zcat obb2cf.$ver.$i.$j.gz | $HOME/bin/lsort ${maxM}M -t\; -k1,4 -u | gzip > obb2cf.$ver.$i.$j.s
```

```sh
lsort ${maxM}M -t\; -k1,1 --merge <(zcat bb2cf.$ver.$i.$j.s) <(zcat bb2cf.$ver.$k.$j.s) | gzip > bb2cf.$ver.$j.s
```

This is the common split -> sort -> sort-per-shard -> merge pattern behind large `.s` map construction.

-------

## Part D -- Python use from a streaming perspective

### Current Python package: `python-woc`

The current Python package is `python-woc`, and the import namespace is `woc`, not `oscar`. Use it for random access to `.tch` maps and stacked `.bin` object stores.

Install it from PyPI with:

```sh
pip3 install python-woc
```

Or install it from source:

```sh
git clone https://github.com/ssc-oscar/python-woc.git
cd python-woc
python3 -m pip install poetry
python3 -m poetry install
```

On some UTK servers, installing Poetry may fail with `urllib3 v2 only supports OpenSSL 1.1.1+`. The current workaround in `python-woc` is:

```sh
python3 -m pip install 'urllib3<2.0'
```

On UTK / PKU WoC servers, profiles are already available at `/home/wocprofile.json` or `/etc/wocprofile.json`, so you usually do not need to generate one yourself. Otherwise, generate a profile with:

```sh
python3 woc.detect /path/to/woc/1 /path/to/woc/2 ... > wocprofile.json
```

By default, `python-woc` looks for `wocprofile.json`, `~/.wocprofile.json`, `/home/wocprofile.json`, and `/etc/wocprofile.json`.

### CLI compatibility

`python-woc` also provides drop-in CLI replacements for the Perl scripts:

```sh
alias getValues='python3 -m woc.get_values'
alias showCnt='python3 -m woc.show_content'
```

The usage is the same as the original scripts, so existing shell examples continue to apply.

### Low-level Python API: `WocMapsLocal`

The low-level Python API is centered on `WocMapsLocal`:

```python
from woc.local import WocMapsLocal

woc = WocMapsLocal()  # or WocMapsLocal(version="R")
```

The three most important methods are:

* `woc.get_values(map_name, key)` - Python equivalent of `getValues`
* `woc.show_content(obj_name, key)` - Python equivalent of `showCnt`
* `woc.count(map_or_object)` - count keys in a map or object family

Examples:

```python
>>> woc.get_values("b2fa", "05fe634ca4c8386349ac519f899145c75fff4169")
('1410029988', 'Audris Mockus <audris@utk.edu>', 'e4af89166a17785c1d741b8b1d5775f3223f510f')
>>> woc.get_values("c2b", "e4af89166a17785c1d741b8b1d5775f3223f510f")
['05fe634ca4c8386349ac519f899145c75fff4169']
>>> woc.show_content("tree", "f1b66dcca490b5c4455af319bc961a34f69c72c2")
[('100644', 'README.md', '05fe634ca4c8386349ac519f899145c75fff4169'), ('100644', 'course.pdf', 'dfcd0359bfb5140b096f69d5fad3c7066f101389')]
>>> woc.count("blob")
17334020520
```

### Object API from `woc.objects`

The object API provides cached wrappers around common WoC entities. It is closer in spirit to `oscar.py`, but it is **not** a drop-in replacement: many names and signatures have been cleaned up to be more consistent and more explicit.

Initialize it like this:

```python
from woc.local import WocMapsLocal
from woc.objects import init_woc_objects

woc = WocMapsLocal()
init_woc_objects(woc)
```

The main classes are:

1. `Author('Name <email>')`
   - `.name`, `.email`
   - `.commits`, `.projects`, `.files`, `.blobs`
   - `.unique_authors`, `.first_blobs`
2. `UniqueAuthor('...')`
   - `.authors`
3. `Blob('sha1')`
   - `.data`, `.commits`, `.files`
   - `.first_author`, `.time_author_commits`
   - `.projects_unique`
   - `.changed_from`, `.changed_to`
4. `Commit('sha1')`
   - `.author`, `.authored_at`, `.committer`, `.committed_at`
   - `.message`, `.full_message`
   - `.tree`, `.parents`, `.children`
   - `.projects`, `.root_projects`
   - `.files`, `.blobs`
   - `.time_author`, `.root`, `.changeset`
   - `.compare(parent)`
5. `File('path/name')`
   - `.path`, `.name`
   - `.authors`, `.blobs`, `.commits`
6. `Tree('sha1')`
   - `.files`, `.blobs`
   - `.traverse()`
7. `Project('owner_repo')`
   - `.url`
   - `.authors`, `.commits`, `.root_projects`
   - `.head`, `.tail`, `.earliest_commit`, `.latest_commit`
   - `.commits_fp()`
8. `RootProject('...')`
   - `.projects`, `.commits`, `.unique_authors`

In the current API, project URLs are exposed as `Project.url`, and commit metadata that used to live in a separate `Commit_info` object is now part of `Commit`.

### Simple Python examples

Get the commits of an author:

```python
from woc.local import WocMapsLocal
from woc.objects import init_woc_objects, Author

woc = WocMapsLocal()
init_woc_objects(woc)

[c.hash for c in Author('"Albert Krawczyk" <pro-logic@optusnet.com.au>').commits[:3]]
```

Get a project URL:

```python
from woc.objects import Project

Project('notcake_gcad').url
```

Move from a commit to its tree and then to the containing project:

```python
from woc.objects import Commit

c = Commit("91f4da4c173e41ffbf0d9ecbe2f07f3a3296933c")
c.tree
c.projects[0].url
```

### Streaming perspective

`python-woc` focuses on random access to `.tch` and `.bin` data. It does **not** natively support flat `.s` / `.gz` files such as thruMaps. For those workloads, keep the first stage in the shell with `zcat`, `grep`, `join`, and related tools, and then hand filtered records to Python only when you need Python-side aggregation or object logic.

-------

## Part E -- MongoDB, ClickHouse, and the web API

These services are useful when random `.tch` lookups are not the right tool:

* use **MongoDB** for precomputed metadata documents about authors, projects, and APIs
* use **ClickHouse** for time-sliced analytics over commits and API-use summaries
* use the **web API** when you want WoC access from a machine that does not have local WoC files mounted

### MongoDB Access

MongoDB provides a convenient place to store relatively small metadata records without forcing everything into Git-object lookup form. The current MongoDB service runs on `da5`.

Two especially useful WoC collections are:

* `A_metadata.<version>` for aliased-author metadata
* `P_metadata.<version>` for deforked-project metadata

There is also `API_metadata.<version>` for package / API summaries.

When on `da5`, access MongoDB with:

```sh
mongosh
```

From another `da` server:

```sh
mongosh --host=da5.eecs.utk.edu
```

Then use the `WoC` database and inspect collections:

```javascript
use WoC
show collections
db.A_metadata.U.findOne({NumCommits: {$gt: 200}})
db.P_metadata.U.findOne({NumCommits: {$gt: 200}})
db.API_metadata.U.findOne({$and: [{NumCommits: {$gt: 200}}, {NumProjects: {$gt: 200}}, {NumAuthors: {$gt: 200}}]})
```

The summary of these collections is:

* `A_metadata.<version>` stores project, commit, file, and originating-blob counts, language distribution, first/last commit times, aliases, and top APIs used by the author
* `P_metadata.<version>` stores author, commit, file, and blob counts, language distribution, first/last commit times, community size, core authors, stars, and forks
* `API_metadata.<version>` stores first/last use plus the number of commits, authors, and projects associated with an API

### PyMongo

PyMongo is the simplest way to read these metadata collections from Python:

```python
import pymongo

client = pymongo.MongoClient("mongodb://da5.eecs.utk.edu/")
db = client["WoC"]
coll = db["A_metadata.U"]
```

For large scans, use a non-expiring cursor and close it explicitly when done:

```python
dataset = coll.find(
    {"NumCommits": {"$gt": 0}},
    {"AuthorID": 1, "NumCommits": 1, "_id": 0},
    no_cursor_timeout=True,
)

for data in dataset:
    print(data)

dataset.close()
```

You can also print specific fields directly:

```python
dataset = coll.find({}, {"AuthorID": 1, "NumCommits": 1, "_id": 0}, no_cursor_timeout=True)
for data in dataset:
    print(data)
dataset.close()
```

### Accessing by time slices with ClickHouse

To access collections indexed by time, use ClickHouse. The current ClickHouse service runs on `da3`.

The current deployment detail that matters for users is:

* use `da3` as the ClickHouse host
* use `commit_v2510` as the current commit table
* `api_all` remains the convenient API summary table

Typical queries:

```sh
clickhouse-client --host=da3 --query 'select count(*) from commit_v2510'
```

```sh
echo "select api,ncmt, nauth, nproj from api_all where match(api, 'stdio') and nauth > 100 limit 3 FORMAT CSV" \
  | clickhouse-client --host=da3 --format_csv_delimiter=";"
```

```sh
clickhouse-client --host=da3 --query 'select author,comment from commit_v2510 where time=1568656268'
```

```sh
echo "select lower(hex(sha1)),author,project,comment from commit_v2510 where match(comment, 'CVE-2021') limit 3 FORMAT CSV" \
  | clickhouse-client --host=da3 --format_csv_delimiter=";"
```

Commit SHA-1s are stored as binary `FixedString(20)`, so either convert them in the query:

```sh
clickhouse-client --host=da3 --query "select lower(hex(sha1)),author,comment from commit_v2510 where match(comment, '^(CVE-(1999|2\\d{3})-(0\\d{2}[0-9]|[1-9]\\d{3,}))$') limit 2 format CSV"
```

or unpack the raw bytes:

```sh
clickhouse-client --host=da3 --query 'select sha1,author,comment from commit_v2510 where time=1568656268 limit 1 format RowBinary' \
  | perl -ane '$sha1=substr($_, 0, 20); $o=unpack "H*", $sha1; $rest=substr($_,21,length($_)-21); print "$o;$rest\n";'
```

ClickHouse is most useful when you query a specific time or a narrow interval. The `lookup/oscarch.py` draft shows the intended Python wrapper style for this service.

### Web API

If you do not have local WoC data mounted, use `python-woc`'s remote client:

```python
from woc.remote import WocMapsRemote

woc = WocMapsRemote(
    base_url="https://worldofcode.org/api",
    api_key="woc-api-key",
)
```

The common APIs mirror local use:

```python
woc.get_values("c2ta", woc.get_values("c2pc", "009d7b6da9c4419fe96ffd1fffb2ee61fa61532a")[0])
woc.show_content("commit", "009d7b6da9c4419fe96ffd1fffb2ee61fa61532a")
```

The object layer works the same way:

```python
from woc.objects import init_woc_objects, Commit

init_woc_objects(woc)
Commit("009d7b6da9c4419fe96ffd1fffb2ee61fa61532a").parents[0].author
```

Batching matters for remote use:

```python
results, errors = woc.show_content_many(
    "commit",
    woc.get_values("a2c", "Audris Mockus <audris@utk.edu>")[:50],
    progress=True,
)
```

Important current limitations:

* `all_keys()` is not implemented for the HTTP API
* version pinning is not implemented in the HTTP API client
* remote access is for random lookups and object retrieval, not for streaming `.s` / `.gz` workloads

-------

## Old material

Older material that was previously in Part F has been moved to [`old_stuff.md`](old_stuff.md).
