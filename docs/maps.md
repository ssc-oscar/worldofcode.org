# World of Code Mappings and Objects

## Naming Scheme

`{relationship}.{0-31}.tch` files can be found in `/da[0-5]_fast/` or `/da[0-5]_data/basemaps`

(.s) signifies that there are either .s or .gz versions of these files in /da[0-5]\_data/basemaps/gz/ folder, which can be opened with Python gzip module or Unix zcat.
all five da[0-5] server may have these .s/.gz files

Keys for identifying letters:

- a = Author
- A = Author after author aliasing
- b = Blob
- c = Commit
- cc = Child Commit
- f = File
- h = Head Commit
- ob = Parent Blob
- p = Project
- pc = Parent Commit
- P = Forked/Root Project (see Note below)
- ta = Time;Author
- fa = First;Author;commit
- r = root commit obtained by traversing commit history
- h = head commit obtained by traversing commit history
- td = Tdiff
- tk = Tokens (ctags)
- trp = Torvalds Path
- L = LICENSE\* files
- Lb - blobs that are shared among fewer than 100 Projects
- fb = firstblob
- tac = time, author, commit
- t = root tree

## Usage

### 1. a2c

Get a list of commits made by an author.

```
Command:
   * echo "git-commit-ID" | ~/lookup/getValues a2c

Examples:
   * echo "Audris Mockus <audris@utk.edu>" | ~/lookup/getValues a2c
   * echo "Adam Tutko <atutko@vols.utk.edu>" | ~/lookup/getValues a2c

Output:
   Formatting: ;CommitId0;...
   Example: ;3ea51a41a5e6f85ce695d4ea56e789a10c9817e9;7c637bbfe419a71df5de89f358aeebf92a096129;
            c21fb159cd8fcb2c1674d353b0a0aaad1f7ed822;c2c65a39879bf443a430ba056ea892c51f0ff12d;
            d2ee19fffa494a1f75333c89c09fb2137444f203

```

### 2. a2f

This prints the file names of blobs (files) created or deleted by an author's commit.

```
Command:
   * echo "git-commit-ID" | ~/lookup/getValues a2f

Examples:
   * echo "Audris Mockus <audris@utk.edu>" | ~/lookup/getValues a2f
   * echo "Adam Tutko <atutko@vols.utk.edu>" | ~/lookup/getValues a2f

Output:
   Formatting: ;FileNames
   Example: Adam Tutko <atutko@vols.utk.edu>;Adam Tutko <atutko@vols.utk.edu>;atutko.md;diffences.md;diffences.txt;proposal.md

```

### 3. b2c

This prints out the commits associated with a file based on it's Blob-ID.

```
Command:
   * echo "Blob-ID" (no quotes) | ~/lookup/getValues b2c

Examples:
   * echo 05fe634ca4c8386349ac519f899145c75fff4169 | ~/lookup/getValues b2c
   * echo a7081031fc8f4fea0d35dd8486f8900febd2347e | ~/lookup/getValues b2c

Output:
   Formatting: "Blob-ID";"Commit-IDs"
   Example: a7081031fc8f4fea0d35dd8486f8900febd2347e;415feccd753c7f974dd94725eaad1e98e3743375;
            7365d601788017bb065c960cde2235f8ced27082;fe1ce9e5e8ebe83569c53ebe1f05f0688136ef2c

```

### 4. c2b

This prints out the Blob-ID associated with the Commit-ID given.

```

Command:
   * echo "Commit-ID" (no quotes) | ~/lookup/getValues c2b

Examples:
   * echo e4af89166a17785c1d741b8b1d5775f3223f510f | ~/lookup/getValues c2b
   * echo fe1ce9e5e8ebe83569c53ebe1f05f0688136ef2c | ~/lookup/getValues c2b

Output:
   Formatting: Blob-ID;Blob-ID
   Example: fe1ce9e5e8ebe83569c53ebe1f05f0688136ef2c;a7081031fc8f4fea0d35dd8486f8900febd2347e

```

### 5. c2p

This prints out the names of the projects assoicuated with the given Commit-ID.

```

Command:
   * echo "Commit-ID" (no quotes) | ~/lookup/getValues c2p
Examples:
   * echo e4af89166a17785c1d741b8b1d5775f3223f510f | ~/lookup/getValues c2p
   * echo fe1ce9e5e8ebe83569c53ebe1f05f0688136ef2c | ~/lookup/getValues c2p

Output:
   Formatting: "Commit-ID";ProjectNames
   Example: e4af89166a17785c1d741b8b1d5775f3223f510f;W4D3_news;chumekaboom_news;fdac15_news;
            fdac_syllabus;igorwiese_syllabus;jaredmichaelsmith_news;jking018_news;milanjpatel_news;
            rroper1_news;tapjdey_news;taurytang_syllabus;tennisjohn21_news
```

### 6. f2c

This prints out the Commit-IDs associated with a file name.

```

Command:
   * echo "File Name" (no quotes) | ~/lookup/getValues f2c

Examples:
   * echo main.c | ~/lookup/getValues f2c
   * echo atutko.md | ~/lookup/getValues f2c

Output:
   Formatting: "File Name";Commit-IDs
   Example: atutko.md;0a26e5acd9444f97f1a9e903117d957772a59c1d;3fc5c3db76306440a43460ab0fb52b27a01a2ab9;
            6176db8cb561292c5f0fdcd7d52eb3f1bca23b36;c21fb159cd8fcb2c1674d353b0a0aaad1f7ed822;
            c9ec77f6434319f9f9c417cf7f9c95ff64540223

```

### 7. p2c

This print out the Commit-IDs associated with a project name.

```
Command:
   * echo "Project Name" (no quotes) | ~/lookup/getValues p2c

Examples:
   * echo ArtiiQ_PocketMine-MP | ~/lookup/getValues p2c

Output:
   Formatting: "Project Name";Commit-IDs
   Example: ArtiiQ_PocketMine-MP;0000000bab11354f9a759332065be5f066c3398f;000a0dedd9364072cb0e64bc48f1fba82c9fba65;
   000ba5de528b3ea9680124f4fbe670867eafd2f8;000dfc860134262a46d8942a3c3b453528d99da9;.......

```

### 8. c2cc

Get the Child-Commit-IDs associated with a Commit-ID

```
Command:
   * echo "Commit-ID" (no quotes) | ~/lookup/getValues c2cc

Examples:
   * echo e4af89166a17785c1d741b8b1d5775f3223f510f | ~/lookup/getValues c2cc
   * echo fe1ce9e5e8ebe83569c53ebe1f05f0688136ef2c | ~/lookup/getValues c2cc

Output:
   Formatting: "Commit-ID";"Child-Commit-ID"
   Example: fe1ce9e5e8ebe83569c53ebe1f05f0688136ef2c;65d49eee6fb6f0fa1d3a69af14ae43311da54907
```

### 9. splitSec

Get the exact .tch file a Blob-ID, Commit-ID, or Tree-ID is located in.

```

Command:
   * echo "Blob, Commit, or Tree-ID" (no quotes) | ~/lookup/splitSec.perl a 32 1

Examples:
   Commit-IDs:
      * echo 000000000001b58ef4d6727f61f4d7f8625feb72 | ~/lookup/splitSec.perl a 32 1
      * echo e4af89166a17785c1d741b8b1d5775f3223f510f | /da3_data/lookup/splitSec.perl a 32 1
   Tree-IDs:
      * echo f1b66dcca490b5c4455af319bc961a34f69c72c2 | ~/lookup/splitSec.perl a 32 1
      * echo 0f8d572eb262b0510788d3ee7445099a256be5cb | ~/lookup/splitSec.perl a 32 1
   Blob-IDs:
      * echo 05fe634ca4c8386349ac519f899145c75fff4169 | ~/lookup/splitSec.perl a 32 1
      * echo a7081031fc8f4fea0d35dd8486f8900febd2347e | ~/lookup/splitSec.perl a 32 1

Output:
   Formatting: #of.tchfile;ID
   Output: 5;05fe634ca4c8386349ac519f899145c75fff4169

```

### 10. c2dat

This command prints out the Author and Time of a commit based on Commit-ID.

```

This command requires you to know the exact .tch file that will be used to pull the information.
In order to get the number of the .tch file, run command 9. The output will resemble 4;e4af89166a17785c1d741b8b1d5775f3223f510f.
Take the number before the ( ; ) and replace the #oftchfile in "da0_data/basemaps/c2datFullU.#oftchfile.tch".

Command:
   * echo "Commit-ID" (no quotes) | ~/lookup/getValues c2dat

Examples:
   * echo 000000000001b58ef4d6727f61f4d7f8625feb72 | ~/lookup/getValues c2dat
   * echo e4af89166a17785c1d741b8b1d5775f3223f510f | ~/lookup/getValues c2dat

Output:
   Formatting: "Commit-ID";UnixTimestamp;TimeZone;"Author-ID";tree;parent(s)
   Example: 000000000001b58ef4d6727f61f4d7f8625feb72;1391011578;+0000;stripe <>;58042b3afdaff75db9c6d10fd7709dc7dd0352e9;0000000003ccdf1d0b512c
b27084f2222675a44f

```

### 11. c2bPtaPkg

**The extent of usage databases: for Go language in /da0_data/play/GothruMaps/m2nPMGo.s mo**

```
These are summaries that specify the specific language dependencies a blob has.
For example, for Python a file that has the statement "import pandas" will specify that the Blob depends on pandas in c2bPta.

Details for PY, for example, are in c2bPtaPkgOPY.{0..31}.gz
also on /lustre/haven/user/audris/basemaps
see grepNew.pbs for exact details.

```

### 12. commit

See the content of a Commit-ID

```
This command prints out the content of a given Commit-ID.

This command has an additional optional paremter that can be added to change the formatting of the output.

This command can only be run on servers with SSDS. To run this command, use the da4 server.

Command:
   * echo "Commit-ID" (no quotes) | ~/lookup/showCnt commit

Examples:
      * echo e4af89166a17785c1d741b8b1d5775f3223f510f | ~/lookup/showCnt commit
      * echo fe1ce9e5e8ebe83569c53ebe1f05f0688136ef2c | ~/lookup/showCnt commit

Output:
   Formatting:
      No Formatting Parameter:
         * "Commit-ID";"Tree-ID";"Parent-ID";"Author";"Committer";"Author Time";"Comitter Time"
      Parameter 1:
         * "Commit-ID";"Commit Time No TZ";"Comitter"
      Parameter 2:
         * "Commit-ID";"Comitter";"Commit Time";"Commit Message"
      Parameter 3:
         * tree "Tree-ID"
           parent "Parent-ID"
           author "Author-ID"
           committer "Committer-ID"

           "Commit Message"
           "Commit Message";"Commit-ID"
      Parameter 4:
         * "Commit-ID";"Comitter"
      Parameter 5:
         * "Commit-ID";"Parent-ID"
      Parameter 6:
         * "Commit-ID";"Commit Time No TZ";"Comitter";"Tree-ID";"Parent-ID"

   Examples:
      * No Formatting:
         * e4af89166a17785c1d741b8b1d5775f3223f510f;f1b66dcca490b5c4455af319bc961a34f69c72c2;c19ff598808b181f1ab2383ff0214520cb3ec659;Audris Mockus <audris@utk.edu>;Audris Mockus <audris@utk.edu>;1410029988 -0400;1410029988 -0400
      * Parameter 1:
         * e4af89166a17785c1d741b8b1d5775f3223f510f;1410029988;Audris Mockus <audris@utk.edu>
      * Parameter 2:
         * e4af89166a17785c1d741b8b1d5775f3223f510f;Audris Mockus <audris@utk.edu>;1410029988 -0400;News for Sep 5
      * Parameter 3:
         *  tree f1b66dcca490b5c4455af319bc961a34f69c72c2
            parent c19ff598808b181f1ab2383ff0214520cb3ec659
            author Audris Mockus <audris@utk.edu> 1410029988 -0400
            committer Audris Mockus <audris@utk.edu> 1410029988 -0400

            News for Sep 5
      * Parameter 4:
         * e4af89166a17785c1d741b8b1d5775f3223f510f;Audris Mockus <audris@utk.edu>
      * Parameter 5:
         * e4af89166a17785c1d741b8b1d5775f3223f510f;c19ff598808b181f1ab2383ff0214520cb3ec659
      * Parameter 6:
         * e4af89166a17785c1d741b8b1d5775f3223f510f;1410029988;Audris Mockus <audris@utk.edu>;f1b66dcca490b5c4455af319bc961a34f69c72c2;c19ff598808b181f1ab2383ff0214520cb3ec659
```

### 13. tree

See the content of a Tree-ID

```
This command prints out the Blob-IDs and File Names of a given Tree-ID.

Command:
   * echo "Tree-ID" (no quotes) | ~/lookup/showCnt tree

Examples:
   * echo f1b66dcca490b5c4455af319bc961a34f69c72c2 | ~/lookup/showCnt tree
   * echo 0f8d572eb262b0510788d3ee7445099a256be5cb | ~/lookup/showCnt tree

Output:
   Formatting: "Mode";"Blob-ID";"FileName"
   Example: 100644;05fe634ca4c8386349ac519f899145c75fff4169;README.md
            100644;dfcd0359bfb5140b096f69d5fad3c7066f101389;course.pdf

```

### 14. blob

See the content of a Blob-ID

```
This command prints out the content of a giver Blob-ID.

Command:
   * echo "Blob-ID" (no quotes) | ~/lookup/showCnt blob

Examples:
   * echo 05fe634ca4c8386349ac519f899145c75fff4169 | ~/lookup/showCnt blob
   * echo a7081031fc8f4fea0d35dd8486f8900febd2347e | ~/lookup/showCnt blob

Output:
   Formatting:
      No Formatting Parameter:
         * "Content of the blob"
      Parameter 1:
         * "Content of the blob with new lines replaced with \n"
   Examples:
      No Formatting Parameter:
         * # Syllabus for "Fundamentals of Digital Archeology"
            ## News
               * Assignment1 due Monday Sep 8 before 2:30PM
               * Be ready to present your findings from Assignment1 on Monday
               * Project 1 teams are formed! You should see Team? where ? is 1-5 in your github page (on the right)
               * Lecture slides are at [Data Discovery](https://github.com/fdac/presentations/dd.pdf)
               * Sep 5 lecture recording failed as 323Link (host for the recording) went down
               ......
      Parameter 1:
         *  # Syllabus for "Fundamentals of Digital Archeology"\n\n## News\n\n* Assignment1 due Monday Sep 8 before 2:30PM\n* Be ready to present your findings from Assignment1 on Monday\n* Project 1 teams are formed! You should see Team? where ? is 1-5 in your github page (on the right)\n* Lecture slides are at [Data Discovery](https://github.com/fdac/presentations/dd.pdf)\n* Sep 5 lecture recording failed as 323Link (host for the recording) went down\n

```
