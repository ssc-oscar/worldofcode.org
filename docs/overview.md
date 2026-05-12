# World of Code (WoC)

![Woc](./assets/woc_logo.webp)

## Main Objective

The primary aim is to develop theoretical, computational, and statistical frameworks that
discover, collect, curate, and make research-ready a close approximation of the entirety of FLOSS operational
data and provide easy-to-use APIs integrated with computing and storage infrastructure that facilitate empirical
studies of the entire FLOSS.

### Objective Breakdown:

- Census of all FLOSS
  - What is out there, of what kind, how much
  - Ability to select projects/developers/APIs for natural experiments/other empirical studies
- Provide FLOSS-wide relationships
  - Technical dependencies (to run applications)
  - Tool dependencies (to build/test applications)
  - Code copying
  - Knowledge (and people) migration
  - API use and spread over time
- Data Cleaned/Augmented/Contextualized
  - Correction: Authors/Forks/Outliers
  - Augmentation: Dependencies/Linking to other data sources
  - Context: project types/expertise
- Big Data Analytics: Map entities to all related entities efficiently
- Timely: Targeting < 1 Quarter old analyzable snapshot of the entire FLOSS
- Community run
  - Hackathons help determine the community needs
  - [Hackathon Schedule](https://github.com/woc-hack/schedule)
- How to participate?
  - [Hackathon Registration Form](http://bit.ly/WoCSignup)
  - If you can not attend the hackathon but just want to try out WoC, please fill the hackathon form but indicate in the topic section is that you do not plan to attend the hackathon.

## Architecture

The breakdown into microservices that contain three major pieces:

  - [gather](https://github.com/ssc-oscar/gather) — discovery of new/updated repos
  - [libgit2](https://github.com/ssc-oscar/libgit2) — efficiently getting only necessary git objects from remotes
  - [lookup](https://bitbucket.org/swsc/lookup/src/master/) — updates, mapping to analytic layers, and scripts to query data
  - [python-woc](https://github.com/ssc-oscar/python-woc) — analytics APIs to query the data

![Workflow](https://github.com/woc-hack/tutorial/blob/master/Assets/Database-workflow.png?raw=true)

Overall description of the data collection and analysis methods: [WoC paper (EMSE 2020)](https://bitbucket.org/swsc/overview/raw/master/pubs/WoC.pdf)

## Current Status

The latest data version is **V2604**, collected March 2026, with git objects retrieved by May 5, 2026.

| Type               | Count           |
| ------------------ | --------------- |
| Commits            | 5,866,595,698   |
| Trees              | 22,301,060,007  |
| Blobs              | tbd             |
| Repositories       | ~269 million    |
| Independent projects | ~190 million  |

For complete version history going back to version J (2018), see the [overview repository](https://bitbucket.org/swsc/overview/).

## Impact

WoC is an unprecedented and unique resource for studying open source software supply chains. Key outcomes include:

- **450+ active registered external researchers**
- **28 core papers** with **3,042 distinct citations**
- **132 external papers** citing WoC-core papers
- Reusable curated datasets: OSS licenses, scientific software repositories, code reuse instances, vulnerable blobs in LLM pre-training data
- Novel tools: [DRS-OSS](https://worldofcode.org/drs) (diff risk scoring), GITAUTHORITY (developer identity de-aliasing)

For the full impact narrative, see [outcomes](https://bitbucket.org/swsc/overview/src/master/outcomes.md).

## Publications

WoC-core and related publications are maintained in the [publications list](https://bitbucket.org/swsc/overview/src/master/publications.md). Key papers include:

- [World of Code: Enabling a Research Workflow for Mining and Analyzing the Universe of Open Source VCS data (EMSE 2020)](https://bitbucket.org/swsc/overview/raw/master/pubs/WoC.pdf)
- [World of Code: An infrastructure for mining the universe of open source VCS data (MSR 2019)](https://bitbucket.org/swsc/overview/raw/master/pubs/WoCMSR.pdf)
- [Dataset: Copy-based Reuse in Open Source Software (MSR 2024)](https://bitbucket.org/swsc/overview/src/master/publications.md)
- [Cracks in The Stack: Hidden Vulnerabilities and Licensing Risks in LLM Pre-Training Datasets (LLM4Code 2025)](https://bitbucket.org/swsc/overview/src/master/publications.md)
- [The Extent of Orphan Vulnerabilities from Code Reuse in Open Source Software (ICSE)](https://bitbucket.org/swsc/overview/src/master/publications.md)

## Talks

- [FSE'19 Keynote](https://bitbucket.org/swsc/overview/raw/master/pubs/WoCFse19.pdf)
- [Shenzhen Pengcheng Lab workshop on open source big data](https://bitbucket.org/swsc/overview/raw/master/pubs/WoCShenZhen19.pdf)
- [Software Supply Chain'2017](https://bitbucket.org/swsc/overview/raw/master/pubs/PKU2017Keynote.pdf)
- [Software Supply Chain'2018](https://bitbucket.org/swsc/overview/raw/master/pubs/PKU2018Keynote.pdf)

## Ecosystem Trends

- [Major language usage and productivity trends](https://bitbucket.org/swsc/overview/src/master/usage/README.md)
- [Fun facts about WoC Collection](crazy.md)
- [The most popular components — used in most projects](https://bitbucket.org/swsc/overview/src/master/deps/README.md)

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
| Kai Gao             | gaokaipku@qq.com      | Undergraduate Student (research assistant)                 |
| Andrey Karnauch     | akarnauc@vols.utk.edu | Graduate Student (research assistant)                      |
| Yuxing Ma           | yma28@vols.utk.edu    | Graduate Student (research assistant)                      |
| Martha E. Milhollin | mmilholl@vols.utk.edu | Graduate Student (research assistant, Jan-Apr 2019)        |
| Sara Mousavi        | mousavi@vols.utk.edu  | Graduate Student (research assistant)                      |
| Zachary Trzil       | ztrzil@vols.utk.edu   | Undergraduate Student (research assistant, Feb-March 2018) |
| Marat Valiev        | marat@cmu.edu         | Graduate Student (research assistant)                      |
| YuLin Xu            | xyl_xuyulin@126.com   | Undergraduate Student (research assistant)                 |
| Yuxia Zhang         | yuxiaz@pku.edu.cn     | Graduate Student (research assistant)                      |

## High Level Description

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
tools.

For the full project description, see the [overview repository](https://bitbucket.org/swsc/overview/).

## Acknowledgment

This material is based upon work supported by the National Science Foundation under Grant No. 1633437

## Disclaimer

Any opinions, findings, and conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the National Science Foundation.
