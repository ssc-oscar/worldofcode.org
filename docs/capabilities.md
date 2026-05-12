# What WoC Can Do For You

World of Code (WoC) is the only infrastructure that connects **all public git repositories** into a single, searchable dataset. It doesn't just mirror repositories — it cross-references every commit, blob, file, author, and project across the entire open source ecosystem.

## Scale

| What | How Much |
|------|----------|
| Commits | ~5 billion |
| Source file versions (blobs) | ~20 billion |
| Repositories | ~235 million |
| Unique author IDs | ~89 million |
| Deduplicated authors | ~59 million |
| Independent projects (forks resolved) | ~156 million |

Data is updated quarterly. See [version history and latest counts](https://bitbucket.org/swsc/overview/).

## What Makes WoC Unique

### Cross-project relationships
No other dataset lets you trace a piece of code, a developer, or a dependency **across all open source projects at once**. WoC maps connect entities globally:

- **Code flow**: given a blob (file version), find every commit and project that contains it — across all of open source
- **Developer activity**: given an author, find every commit they made in every project, not just one repository
- **Dependency tracking**: for Python, JavaScript, Java, Go, Rust, C/C++, and more — see which modules a project imports, and how adoption spreads over time

### Author identity resolution
The same person may appear as dozens of different `Author Name <email>` strings across projects. WoC's aliasing maps (`a2A`, `A2a`) resolve ~89M raw author IDs down to ~59M real people, using machine learning and graph-based techniques.

### Fork deduplication
Of ~235M repositories, many are forks or mirrors. WoC identifies independent projects by detecting shared commits via community detection algorithms, reducing to ~156M truly distinct projects.

### Complete git object access
Every commit, tree, blob, and tag is stored and retrievable by SHA1. You can inspect the actual content of any file version that ever existed in any public repository.

## Use Cases

### For Researchers
- **Natural experiments at scale**: instead of convenience-sampling a few hundred GitHub projects, select from the entire population with controlled criteria
- **Supply chain analysis**: trace how vulnerabilities, code patterns, or dependencies propagate across the ecosystem
- **Developer studies**: analyze career trajectories, expertise, and collaboration patterns across all projects a person has touched
- **Technology adoption**: measure how programming languages, frameworks, and APIs spread through the developer population over time

### For Security Analysts
- **Vulnerability propagation**: given a vulnerable blob, find every project that contains it — including projects that copied the code rather than depending on the package
- **CVE tracking**: search commit messages across all repositories for CVE references
- **Risk scoring**: [DRS-OSS](https://worldofcode.org/drs), an LLM-driven diff risk scoring tool, predicts pull request risk
- **Supply chain auditing**: identify all transitive dependencies and code reuse relationships for a project

### For Developers
- **Understand your reach**: see which projects use your code, even when it was copied rather than installed as a package
- **Find expertise**: identify developers who have worked with specific APIs, languages, or codebases
- **Explore the ecosystem**: discover projects related to yours through shared code, shared developers, or shared dependencies

## Quick Examples

**Trace a file across all of open source:**
```python
from woc.local import WocMapsLocal
woc = WocMapsLocal()

# Where did this blob first appear?
woc.get_values("b2tac", "05fe634ca4c8386349ac519f899145c75fff4169")
# → ('1410029988', 'Audris Mockus <audris@utk.edu>', 'e4af89166a17785c1d741b8b1d5775f3223f510f')

# Which projects contain this commit?
woc.get_values("c2p", "e4af89166a17785c1d741b8b1d5775f3223f510f")
# → ['fdac15_news', 'jaredmichaelsmith_news', ...]
```

**Find all identities of an author:**
```sh
echo 'Warner Losh <imp@FreeBSD.org>' | ~/lookup/getValues a2A
# → Warner Losh <imp@FreeBSD.org>;imp <imp@bsdimp.com>

echo 'imp <imp@bsdimp.com>' | ~/lookup/getValues A2a
# → imp <imp@bsdimp.com>;M. Warner Losh <imp@bsdimp.com>;M. Warner Losh <imp@freebsd.org>;...
```

**Search commits for CVEs:**
```sh
echo "select lower(hex(sha1)),author,comment from commit_v2510 \
  where match(comment, 'CVE-2021') limit 3 FORMAT CSV" \
  | clickhouse-client --host=da3 --format_csv_delimiter=";"
```

**Use the API remotely (no server access needed):**
```python
from woc.remote import WocMapsRemote
woc = WocMapsRemote(base_url="https://worldofcode.org/api", api_key="your-key")
woc.show_content("commit", "009d7b6da9c4419fe96ffd1fffb2ee61fa61532a")
```

## By the Numbers

Some things only a dataset of this scale can reveal — see [Fun Facts](crazy.md) for the full list:

- The longest commit chain is **9.96 million** commits deep
- The empty blob (`e69de29bb...`) appears in **153 million** commits
- `README.md` has been modified in **109 million** commits
- One author has commits in **277,000** repositories

## Access

- **Web**: [worldofcode.org](https://worldofcode.org/) — browse, look up, and sample data
- **API**: [API docs](https://wocapi-preview.osslab-pku.org/docs) — HTTP API with OpenAI-style API keys
- **Python**: `pip install python-woc` — [documentation](https://ssc-oscar.github.io/python-woc/)
- **Shell**: direct access on `da` servers via `getValues` and `showCnt` commands
- **Registration**: [sign up here](https://docs.google.com/forms/d/e/1FAIpQLSd4vA5Exr-pgySRHX_NWqLz9VTV2DB6XMlR-gue_CQm51qLOQ/viewform?vc=0&c=0&w=1&flr=0&usp=mail_form_link)

## Learn More

- [Tutorial](tutorial.md) — hands-on setup and walkthrough
- [Outcomes and impact](https://bitbucket.org/swsc/overview/src/master/outcomes.md) — research impact summary
- [Publications](https://bitbucket.org/swsc/overview/src/master/publications.md) — 28 core papers, 479 citing papers, 3042 citations
- [WoC Discord](https://discord.gg/fKPFxzWqZX) — community support
