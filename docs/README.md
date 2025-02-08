# World of Code (WoC)

![Woc](./assets/woc_logo.webp)

# Objective

The primary aim is to develop theoretical, computational, and statistical frameworks that
discover, collect, curate, and make research-ready a close approximation of the entirety of FLOSS operational
data and provide easy-to-use APIs integrated with computing and storage infrastructure that facilitate empirical
studies of the entire FLOSS.

## Overall description of the data collection and analysis methods

This describes the data collection/update https://bitbucket.org/swsc/overview/raw/master/pubs/WoC.pdf

[A tutorial on how to use WoC](https://bitbucket.org/swsc/lookup/src/master/tutorial.md)

[WoC APIs](https://bitbucket.org/swsc/lookup/src/master/README.md)

The breakdown into microservices that coontain three major pieces:

     - https://github.com/ssc-oscar/gather is for discovery of new/updated repos
     - https://github.com/ssc-oscar/libgit2 is for efficiently getting only necessary git objects from remotes
     - https://bitbucket.org/swsc/lookup/src/master/ thats where updates, mapping to analytic layers, and scripts to query stuff are. Still needs refactoring into update/query parts
     - https://github.com/ssc-oscar/oscar.py is for analytics APIs to query the data

- Sections

  - [Major language usage and productivity trends](https://bitbucket.org/swsc/overview/src/master/usage/README.md)
  - [Fun facts about WoC Collection](https://bitbucket.org/swsc/overview/src/master/fun/README.md)
  - [The most popular components -- used in most projects](https://bitbucket.org/swsc/overview/src/master/deps/README.md)

* Talks

  - [FSE'19 Keynote](https://bitbucket.org/swsc/overview/raw/master/pubs/WoCFse19.pdf) or [here](https://esec-fse19.ut.ee/wp-content/uploads/2019/08/WoCFse19.pdf)
  - [Talk at Shenzhen Pengcheng Lab workshop on open source big data](https://bitbucket.org/swsc/overview/raw/master/pubs/WoCShenZhen19.pdf)
  - [Software Supply Chain'2017](https://bitbucket.org/swsc/overview/raw/master/pubs/PKU2017Keynote.pdf)
  - [Software Supply Chain'2018](https://bitbucket.org/swsc/overview/raw/master/pubs/PKU2018Keynote.pdf)
  - [EHR supply chain](https://bitbucket.org/swsc/overview/raw/master/pubs/HICSS2019_EHRpanel.pdf)
  - [EHR supply chain](https://bitbucket.org/swsc/overview/raw/master/pubs/HICSS2019_EHRpanel.pdf)

* Publications on SwSC Applications

  - [Representation of Developer Expertise in Open Source Software, ICSE'21 draft](https://bitbucket.org/swsc/overview/raw/master/pubs/Skill-space-draft.pdf)
  - [Modeling relationship between post-release faults and usage in mobile software. In Proceedings of the 14th International Conference on Predictive Models and Data Analytics in Software Engineering(PROMISE) 2018. ](https://dl.acm.org/doi/pdf/10.1145/3273934.3273941?casa_token=KeE4IOHRki4AAAAA:dGfjKNLzDPtgJ-2pG22_WRxaXR2FBbws-7wrP4-3uzfOKyFyqI-gOehbW0YuU7XzDHZNHkznmNXK)
  - [Are software dependency supply chain metrics useful in predicting change of popularity of NPM packages?, PROMISE'18](https://dl.acm.org/doi/pdf/10.1145/3273934.3273942?casa_token=HkxEtEm6nL0AAAAA:MXPRwa7NCDTFo3ENaIOM3fYM8_WhXm4uRbAVol4RGswBrtgVfE-OQ4qXUqT-QabWxl8Yqn5pQ_Xc)
  - [Developer reputation estimator (DRE). In ASE'19, 2019](https://bitbucket.org/swsc/overview/raw/master/pubs/ase-tools-paper.pdf)
  - [Patterns of effort contribution and demand and user classification based on participation patterns in NPM ecosystem. In Proceedings of the 15th International Conference on Predictive Models and Data Analytics in Software Engineering (PROMISE). ACM, 2019](https://dl.acm.org/doi/pdf/10.1145/3273934.3273942?casa_token=HkxEtEm6nL0AAAAA:MXPRwa7NCDTFo3ENaIOM3fYM8_WhXm4uRbAVol4RGswBrtgVfE-OQ4qXUqT-QabWxl8Yqn5pQ_Xc)
  - [Deriving a usage-independent software quality metric, Empirical Software Engineering (2020): 1-46](https://arxiv.org/pdf/2002.09989)
  - [A Methodology for Analyzing Uptake of Software Technologies Among Developers](https://bitbucket.org/swsc/overview/raw/master/pubs/TSE2993758.pdf)

- Publications on SwSC Infrastructure and Measurement

  - [World of Code: Enabling a Research Workflow for Mining and Analyzing the Universe of Open Source VCS data, International Journal on Empirical Software Engineering Oct, 2020(accepted)](https://bitbucket.org/swsc/overview/raw/master/pubs/WoC.pdf)
  - [World of Code: An infrastructure for mining the universe of open source vcs data. In IEEE Working Conference on Mining Software Repositories, May 26 2019](https://bitbucket.org/swsc/overview/raw/master/pubs/WoCMSR.pdf)
  - [How to measure software supply chain? A methodology for measuring floss ecosystems. In Towards Engineering Free/Libre Open Source Software (FLOSS) Ecosystems for Impact and Sustainability: Communications of NII Shonan Meetings. 2019](https://bitbucket.org/swsc/overview/raw/master/pubs/measuring-supply-chain.pdf)
  - [Constructing Supply Chains in Open Source Software. In ICSE Companion Proceedings, 2018](https://dl.acm.org/doi/pdf/10.1145/3183440.3183454)
  - [ALFAA: Active learning fingerprint based anti-aliasing for correcting developer identity errors in version control systems. International Journal of Empirical Software Engineering, 2019](https://arxiv.org/pdf/1901.03363)
  - [Detecting and Characterizing Bots that Commit Code, MSR'20](https://arxiv.org/pdf/2003.03172)
  - [A Complete Set of Related Git Repositories Identified via Community Detection Approaches Based on Shared Commits, MSR'20](https://arxiv.org/pdf/2002.02707)
  - [A Dataset for GitHub Repository Deduplication, MSR'20](https://arxiv.org/pdf/2002.02314)
  - [A Dataset and an Approach for Identity Resolution of 38 Million Author IDs extracted from 2B Git Commits, MSR'20](https://arxiv.org/abs/2003.08349)
  - [How to get valid social networks?](https://bitbucket.org/swsc/overview/raw/master/pubs/correcting-developer-identity.pdf)

- Blogs
  - [Coke vs. Pepsi? data.table vs. tidy? Examining Consumption Preferences for Data Scientists](https://www.r-bloggers.com/coke-vs-pepsi-data-table-vs-tidy-examining-consumption-preferences-for-data-scientists/)
  - [Coke vs. Pepsi? data.table vs. tidy? Part 2](https://r-posts.com/coke-vs-pepsi-data-table-vs-tidy-part-2)

## Status

The WoC data version V4 was collected based on updates/new repositories identified during May, 2024, and the git objects retrieved by Aug 3, 2024.

| TYpe               | Count       |
| ------------------ | ----------- |
| commit             | 4942319288  |
| tree               | 19119150636 |
| blob               | 20433966103 |
| Projects(repos)    |             |
| Author IDs         |             |
| Projects(deforked) |             |
| Authors (aliased)  |             |

The WoC data version V3 was collected based on updates/new repositories identified during March 1-30, 2024, and the git objects retrieved by Mid May, 2024.

| TYpe               | Count       |
| ------------------ | ----------- |
| commit             | 4735641321  |
| tree               | 18449243835 |
| blob               | 19619563902 |
| Projects(repos)    | 234859941   |
| Author IDs         | 89104948    |
| Projects(deforked) | 155838776   |
| Authors (aliased)  | 58722323    |

The WoC data version V was collected based on updates/new repositories identified during March 1-30, 2023, and the git objects retrieved by Mid May, 2023.

| TYpe               | Count       |
| ------------------ | ----------- |
| commit             | 3928321624  |
| tree               | 15426363444 |
| blob               | 16252394678 |
| Projects(repos)    | 209048151   |
| Author IDs         | 76283594    |
| Projects(deforked) | 131171380   |
| Authors (aliased)  | 44807991    |

The WoC data version U was collected based on updates/new repositories identified during Oct 20-30, 2021, and the git objects retrieved by Nov 28. Over 48M new/updated repos were identified and over 100TB of new data was transferred.

The 173M git repositories contain over 3.1B commits (520M or 20% increase) over these eight months. The number of blobs, trees, and repos also increased by 20%. The monthly rate of new commits at 65M exceeds that of the previous period (60M/month), but it is relatively smaller with respect to the total commits (3.1B for version U vs 2.6B for version T).

| Type   | Count       |
| ------ | ----------- |
| commit | 3113067760  |
| tree   | 12559784378 |
| blob   | 12490439543 |

This data (version T) collected based on updates/new repositories identified on Feb 12, 2021,
and the git objects have been retrieved by Mar 16. Over 14M new/updated repos were identified and new data
exceeded 35TB.

Almost 300M commits and 1.2B trees were added over these five months.
There were over 52M distinct author IDs. Of them, 1,029,324 were for organizations, used by more than one author, or had insufficient information for actual author identification.
From the remaining 51,326,297 author IDs 35,288,533 distinct authors were identified.
Of the 146M distinct repos 89,840,664 were not clones or forks of others.

| Number      | type                             |
| ----------- | -------------------------------- |
| 2595586645  | commit                           |
| 10461125872 | blob                             |
| 10687786993 | tree                             |
| 20216545    | tag                              |
| 146138675   | projects (distinct repositories) |
| 52355621    | author IDs                       |

This data (version S) collected based on updates/new repositories identified on Aug 28, 2020,
and the git objects have been retrieved by Sep 18.

Almost 300M commits and 1.2B trees were added over these five months.
There were over 47M distinct author IDs: an 11% increase in
comparison to the 15% increase in the number of commits and
trees. The number of repositories increased by 9%.

| Number            | type                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 9192389809        | blob                                                                                                                                         |
| 2326069143        | commit                                                                                                                                       |
| 9497019087        | tree                                                                                                                                         |
| 18897726          | tag                                                                                                                                          |
| 135162320         | projects (distinct repositories)                                                                                                             |
| 47247366          | author IDs                                                                                                                                   |
| 79636139/98520750 | Independent projects (forks resolved via shared commit + unweighted/weighted Louvain community detection) as described in gh:ssc-oscar/forks |

This data (version R) collected based on updates/new repositories identified on Mar 7, 2020,
and the git objects have been retrieved by Mar 28.

The number of commits/trees/tags, projects (distinct repositories), and
distinct author IDs are shown in the table below.

165M commits were created over this three month period adding 714M nonbinary blobs and 718M trees.
Furthermore, 7.5M new repositories were added and almost 4M new author IDs were involved.

| Number     | type                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| 7918470940 | blob                                                                                                                     |
| 2034176272 | commit                                                                                                                   |
| 8314665609 | tree                                                                                                                     |
| 17309912   | tag                                                                                                                      |
| 123805145  | projects (distinct repositories)                                                                                         |
| 42138325   | author IDs                                                                                                               |
| 68553250   | Independent projects (forks resolved via shared commit + Louvain community detection) as described in gh:ssc-oscar/forks |

This data (version Q) collected on Nov 9 based on updates/new repositories identified on Oct 15, 2019,
and the git objects have been retrieved by Dec 28.

The number of commits/trees/tags, projects (distinct repositories), and
distinct author IDs are shown in the table below.
The notable increase in the number of projects from version P is mainly due to collecting
commits from all the forks. The number of unique projects (projects that share no commits) is much lower: 61921909.
The largest group of forked (according to the relationship of a shared commit) projects contains 13912612 distinct repositories.
Only nonempty repositories are included in these counts.
Furthermore, only 65569914 disctinct clusters of unrelated (through parent/child relationship)
commits exist and of these only 51918448 groups contain more than one commit. The largest group has
53709923 commits related via parent-child relationship.

| Number     | type                             |
| ---------- | -------------------------------- |
| 7204111388 | blob                             |
| 1868632121 | commit                           |
| 7596825726 | tree                             |
| 16172556   | tag                              |
| 116265607  | projects (distinct repositories) |
| 38362013   | author IDs                       |

This data (version P) collection on May 15-June 5 based on updates/new repositories identified on May 15, 2019
has 73314320 unique non-forked git repositories, 34424362 unique author IDs, and

| Number     | type   |
| ---------- | ------ |
| 6466663836 | blob   |
| 1685985529 | commit |
| 6861187752 | tree   |
| 12794392   | tag    |

This data (version O) collection on Apr 1-10 based on updates/new repositories identified on Apr 10, 2019
has 68386801 unique non-forked git repositories, 32757289 unique author IDs, and

| Number     | type   |
| ---------- | ------ |
| 6028240353 | blob   |
| 1592136050 | commit |
| 6477758655 | tree   |
| 12343516   | tag    |

This data (version N) collection on Feb 15-25 based on updates/new repositories identified on Feb 10, 2019, had
31356272 unique author IDs, 65679542 unique non-forked git repositories and

| Number     | type   |
| ---------- | ------ |
| 5761659437 | blob   |
| 1524390485 | commit |
| 6209360212 | tree   |
| 11712941   | tag    |

Version M collection on Jan 10-20 based on updates/new repositories identified on Jan 3, 2019, had

| Number     | type                                      |
| ---------- | ----------------------------------------- |
| 5561137754 | blob (considered by git to be text files) |
| 1468800973 | commit                                    |
| 6009633262 | tree                                      |
| 11470696   | tag                                       |

This data version (M) has the total number of distinct repos at 63847092 (48005716 adjusted for
forking, i.e., sharing a commit) and the number of unique author IDs at 30439015.

Collection on Dec 10-22 based on updates/new repositories identified on Dec 3, 2018, had

| Number     | type                                      |
| ---------- | ----------------------------------------- |
| 5313256585 | blob (considered by git to be text files) |
| 1419161099 | commit                                    |
| 5786313329 | tree                                      |
| 9518401    | tag                                       |

This data version is version L

Furthermore, 28455871 unique author strings were in the 1.4B commits of data version K.
This number is raw and not adjusted for synonyms and is based on the actual changes to the
code, not reporting issues. The number of code authors that had more than 25 commits is
approximately 20% of the total (5.7M) and 10% (or 2.8M) have made more than 63 commits.
7M have made just one commit.

The number of unique projects (repos) is 59627553.

21935945 unique author strings were in the 1.1B commits of data version J.

## Team

| Name                | Email                 | Role                                                       |
| ------------------- | --------------------- | ---------------------------------------------------------- |
| Audris Mockus       | audris@utk.edu        | PD/PI                                                      |
| James Herbsleb      | jdh@cs.cmu.edu        | Co-PD/PI                                                   |
| Bogdan C Bichescu   | bbichescu@utk.edu     | Co-PD/PI                                                   |
| Randy Bradley       | rbradley@utk.edu      | Co-PD/PI                                                   |
| Russell L Zaretzki  | rzaretzk@utk.edu      | Co-PD/PI                                                   |
| Chris Bogart        | cbogart@cmu.edu       | Co-PD (Research Scientist)                                 |
| Minghui Zhou        | zhmh@pku.edu.cn       | Co-PD (Professor)                                          |
| Sadika Amreen       | samreen@vols.utk.edu  | Graduate Student (research assistant)                      |
| Tapajit Dey         | tdey2@vols.utk.edu    | Graduate Student (research assistant)                      |
| Kai Gao             | gaokaipku@qq.com      | Undegraduate Student (research assistant)                  |
| Andrey Karnauch     | akarnauc@vols.utk.edu | Graduate Student (research assistant)                      |
| Yuxing Ma           | yma28@vols.utk.edu    | Graduate Student (research assistant)                      |
| Martha E. Milhollin | mmilholl@vols.utk.edu | Graduate Student (research assistant , Jan-Apr 2019)       |
| Sara Mousavi        | mousavi@vols.utk.edu  | Graduate Student (research assistant)                      |
| Zachary Trzil       | ztrzil@vols.utk.edu   | Undergraduate Student (research assistant, Feb-March 2018) |
| Marat Valiev        | marat@cmu.edu         | Graduate Student (research assistant)                      |
| YuLin Xu            | xyl_xuyulin@126.com   | Undegraduate Student (research assistant)                  |
| Yuxia Zhang         | yuxiaz@pku.edu.cn     | Graduate Student (research assistant)                      |

# High level description

Open source software is an engine for innovation and a critical
infrastructure for the nation and yet it is implemented by
communities formed from a loose collection of individuals. With each
software project relying on thousands of other software projects,
this complex and dynamic supply chain introduces new risks and
unpredictability, since, unlike in traditional software projects, no
contractual relationships with the community exist and individuals
could simply lose interest or move on to other activities. This
project aims to advance the state of knowledge of software supply
chains by collecting and integrating massive public operational data
representing development activity and source code from all open
source projects and using it to develop novel theories, methods, and
tools. The transformative change in the theoretical basis for the
supply chains from data-poor, survey-based to data-rich operational
data-based approaches will lead to development of tools and
practices to quantify and mitigate previously unknown risks in the
rapidly changing global environment with no centralized control or
authority. Expected results include dramatic reductions in risks
manifested in, for example, the spread of vulnerabilities or
knowledge loss, making the nation both safer and more innovative. The
novel theoretical frameworks are expected to provide basis for
emerging supply chains, such as 3-D blueprints. The
outreach to open source communities and supporting companies is
expected to transform the way open source software is selected and
developed. The workshops and courses will train a new generation of
scientists and software engineers capable of quantifying and
managing risks in decentralized environments.

The project will construct and analyze the open source supply chain
(OSSC) to determine its global and local properties. The properties
of individual nodes will be modeled using software development
activity data and integrated with the OSSC network to identify the
dynamic properties of the network, risk propagation, and
system-level risks. Statistical and game-theoretic models will be
used to evaluate processes with the goal of assessing and mitigating
these risks. Methods to contextualize, augment, and correct
operational data will be developed to cope with data's size,
complexity, and observational nature. In an OSSC the end users and
downstream developers have an ongoing need to ensure continued
compatibility and to respond in a coordinated way to changes in
operating systems, libraries, hardware, and other
infrastructure, but practical or theoretical guidance on how to manage
risks and do it effectively is lacking with many risks either
not recognized or not evaluated in OSSCs. Version control systems
record code changes along with metadata including author, date, and
commit description explaining the reason for the change. This
operational data provides basic building blocks linking developers
and code and is used in four research themes: 1) identify
visibility, network, and congruency risks of OSSC, 2) develop ways
of evaluating these risks, 3) identify and develop practices to
mitigate these risks, and 4) develop computational models and tools
to assess and mitigate risks for specific value chains.

## Acknowledgment

This material is based upon work supported by the National Science Foundation under Grant No. 1633437

## Disclaimer

Any opinions, findings, and conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the National Science Foundation.
