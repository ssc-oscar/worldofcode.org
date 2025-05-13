## Mongo Database

On the da3 server, there is a MongoDB server holding some relevant
data. This data includes some information that was used for data
analysis in the past. Mongo provides an excellent place to store
relatively small data without requiring relational information.

Two collections the WoC database cand be helpful for sampling
projects and authors A_metadata.V3 and P.metadata.V3 where V3
represents the version, A stands for aliased author id
and P for deforked repository name.

### MongoDB Access

When on the da3 server, you can gain access to the MongoDB server simply by running the command `mongosh`.

Once on the server, you can see all the available databases using the `show dbs` command. However, the database that pertains primarily to the WoC is the WoC database.

Most databases are used for teaching and other tasks, so please use
WoC database using the `use "database name"` command, E.G. (`use WoC`), and, after switching, you can view the available collections in the database by using the `show collections` command.

Currently, there is an author metadata collection (A_metadata.V3)
that contains basic stats: the total number of projects,
the total number of blobs created by them (before
anyone else), the total number
of commits made, the total number of files they have modified, the
distribution of language files modified by that author,
and the first and last time the author committed in Unix Timestamp based on the
data contained on version S of WoC. Author names have ben aliased
and the number of aliases and the list are also included in the record.
Furthermore, up to 100 most commonly used API (packages) in author modified files are
also included.

Alongside this, there is a similar collection for projects on WoC
(P_metadata.V3) that contains the total number of authors on the
project, the total number of commits, the total number of files, the
distribution of languages used, the first and last time there was a
commit to the project in Unix Timestamp based on the version U of
WoC. Since the project is deforked, the community size (the number
of other projects that share commits with the deforeked project) is
also provided. WoC relation P2p can be used to list other projects
linked to it. We also provide additional info based on linking to
attributes that exist only in GitHub. That data is not as recent,
however and more work is needed to make it complete. These
attributes include the number of stars GitHub has given that project
(if any), if the project is a GitHub fork, and where it was forked
from (if anywhere).

Finally the collection of APIs or packages contains summary of the first and last time the package was used in a modified file as well as the number of commits, authors and repositories associated with the use of that package.

To see data in one of the collections, you can run the `db.collection name.findOne()` command. This will show the first element in the collection and should help clarify what is in the collection.

When the above `findOne()` command is run on the A_metadata.V3
collection, the output is as follows:

* Note: For this example, we are only looking for items with more than 200 commits

---

```
[username@da3]~% mongosh
mongosh> use WoC
switched to db WoC
WoC> db.A_metadata.V3.findOne({NumCommits:{$gt:200}})
{
  _id: ObjectId('6718b9ba33bdaab25dc17557'),
  NumAlias: 2,
  NumActiveMon: 36,
  NumProjects: 13,
  AuthorID: 'cojenco <cathyo@google.com>',
  FileInfo: {
    Sql: 2,
    Java: 2,
    JavaScript: 497,
    Go: 8294,
    Python: 952,
    Rust: 50,
    'C/C++': 35,
    other: 1489
  },
  MonNcmt: {
    '2021-08': 30,
    '2021-09': 36,
    '2022-02': 7,
    '2023-08': 5,
    '2022-12': 1,
    '2021-11': 7,
    '2022-08': 20,
    '2023-05': 9,
    '2023-07': 5,
    '2021-10': 25,
    '2021-12': 10,
    '2024-01': 10,
    '2024-02': 4,
    '2023-06': 10,
    '2022-07': 28,
    '2021-06': 20,
    '2024-03': 9,
    '2023-02': 5,
    '2023-12': 7,
    '2022-06': 28,
    '2023-11': 6,
    '2021-05': 4,
    '2022-10': 12,
    '2023-04': 9,
    '2022-03': 26,
    '2022-01': 6,
    '2023-03': 6,
    '2023-10': 15,
    '2023-09': 1,
    '2023-01': 6,
    '2021-07': 16,
    '2022-09': 14,
    '2022-04': 11,
    '2022-11': 17,
    '2022-05': 24,
    '2024-04': 4
  },
  EarliestCommitDate: 1622854057,
  NumCommits: 1193,
  NumOriginatingBlobs: 1402,
  LatestCommitDate: 1710798220,
  NumFiles: 11321,
  MonNprj: {
    '2023-09': 1,
    '2023-01': 2,
    '2021-07': 4,
    '2022-05': 2,
    '2022-11': 2,
    '2024-04': 1,
    '2022-09': 4,
    '2022-04': 2,
    '2023-11': 2,
    '2022-06': 2,
    '2023-12': 1,
    '2023-02': 1,
    '2022-01': 2,
    '2023-03': 1,
    '2023-10': 2,
    '2023-04': 5,
    '2022-10': 2,
    '2021-05': 2,
    '2022-03': 5,
    '2021-12': 3,
    '2024-01': 3,
    '2023-07': 2,
    '2021-10': 2,
    '2024-03': 1,
    '2023-06': 2,
    '2024-02': 1,
    '2021-06': 2,
    '2022-07': 3,
    '2023-08': 2,
    '2021-09': 5,
    '2022-02': 2,
    '2021-08': 5,
    '2021-11': 1,
    '2022-08': 3,
    '2023-05': 2,
    '2022-12': 1
  },
  Alias: [ 'Cathy Ouyang <cathyo@google.com>', 'cojenco <cathyo@google.com>' ],
  emails: [ 'cathyo@google.com', 'cathyo@google.com', 'cathyo@google.com' ]
}
WoC> 
```

Similarly for projects:

```
WoC> db.P_metadata.V3.findOne({NumCommits:{$gt:200}})
{
  _id: ObjectId('681976c3c7146950d9643c8d'),
  FileInfo: { other: 256, Sql: 21, JavaScript: 10, Java: 60, TypeScript: 104 },
  NumCommits: 306,
  ProjectID: 'groupTwo123_group-purchase-System',
  NumForks: 0,
  NumAuthors: 7,
  NumBlobs: 1040,
  NumFiles: 451,
  NumCore: 1,
  CommunitySize: 1,
  NumActiveMon: 2,
  LatestCommitDate: 1545956187,
  EarliestCommitDate: 1542701069,
  Core: { 'huangcw111 <519873176@qq.com>': '178' },
  MonNcmt: { '2018-12': 200, '2018-11': 106 },
  MonNauth: { '2018-11': 5, '2018-12': 5 }
}
WoC> 
```

And for APIs:

```
WoC> db.API_metadata.V.findOne({$and: [ { NumCommits:{$gt:200} }, { NumProjects: {$gt:200} }, {NumAuthors:{$gt:200}} ]})
{
  _id: ObjectId('651646ad2b3e6d618dfbac0e'),
  FileInfo: { 'C/C++': 34422 },
  NumAuthors: 2487,
  EarliestCommitDate: 946684970,
  NumProjects: 1449,
  NumCommits: 34422,
  API: 'C:PoseArray.h',
  LatestCommitDate: 1684051316
}
WoC> 
```

This metadata can then be parsed for the desired information.

Python, like most other programming languages, has an interface with
Mongo that makes for data storage/retrieval much simpler. When
retrieving or inputting large amounts of data onto the servers, it
is almost always faster and easier to do so through one of the
interfaces provided.

---

### PyMongo

PyMongo is an import for Python that simplifies access to the database and elements inside of it. When accessing the server you must first provide which Mongo Client you wish to connect to. For our server, the host will be "mongodb://da3.eecs.utk.edu/".
This will allow access to the data already saved and will allow for creation of new data if desired.

From there, accessing databases inside of the client becomes as simple as treating the desired database as an element inside the client. The same is true for accessing collections inside of a database.
The below code illustrates this process.

```python
import pymongo
client = pymongo.MongoClient("mongodb://da3.eecs.utk.edu/")

db = client["WoC"]
coll = db["A_metadata.V3"]
```

#### Data Retrieval using PyMongo

When attempting to retrieve data, iterating over the entire collection for specific info is often neccesary. This is done most often through a mongo specific data structure called cursors. However, cursors have a limited life span. After roughly 10 minutes of continuous connection to the server, the cursor is forcibly disconnected. This is to limit the possible number of idle cursors connected to the server at any time.

Taking this into consideration, if the process may take longer than that, it is neccesary to define the cursor as undying. If this is neccesary, manual disconnection of the cursor after it's served it's purpose is required as well.
The below code illustrates creation and iteration over the collection with a cursor.

```python
client = pymongo.MongoClient("mongodb://da3.eecs.utk.edu/")

db = client["WoC"]
coll = db["A_metadata.V3"]

dataset = col.find({}, cursor_no_timeout=True)
for data in dataset:
   ...

dataset.close()
```

Once data retrieval has begun, accessing the specific information desired is simple.
For example, provided above is the information saved in one element
of auth_metadata. If access to the AuthorID of each cursor is
desired, the "AuthorID" can be treated as the key in a key
value-mapping. However, it is often neccesary to consider how the
data is stored.

Most often, when storing data in Mongo, it will be stored in Mongo
specific format called BSON. BSON objects are saved in
unicode. Working with unicode can be an issue if printing needs to
be done. As such, decoding from unicode must to be done. Below
illustrates a small program that prints each AuthorID from the
auth_metadata collection.


```python
import pymongo
import bson

client = pymongo.MongoClient("mongodb://da3.eecs.utk.edu/")
db = client ['WoC']
coll = db['A_metadata.V3']

dataset = coll.find({}, no_cursor_timeout=True)
for data in dataset:
    a = data["AuthorID"].encode('utf-8').strip()
    print(a)

dataset.close()
```

When retrieving data, it is often neccesary to narrow the
results. This is possible directly through Mongo when querying for
information. For instance, if all the data is not needed in the
auth_metadata, just the NumCommits and the AuthorID, the query can
be restricted adding parameters to the find call. An example query
is provided below.

```python
dataset = coll.find({}, {"AuthorID": 1, "NumCommits": 1, "_id": 0}, no_cursor_timeout=True)

for data in dataset:
    print(data)

dataset.close()
```

This specific call allows for direct printing of the data, however, as noted above, the names are saved in BSON and as such will be printed in unicode. The first 10 results are shown below.

```
{u'NumCommits': 1, u'AuthorID': u'  <mvivekananda@virtusa.com>'}
{u'NumCommits': 0, u'AuthorID': u' <1151643598@163.com>'}
...
```

Sometimes, restricting the data even further is neccesary. Notice above that many of the users have 0 commits. Exclusion of these entries may be desired. The below example illustrates a way to restrict the results to only users with greater than 0 commits.

```python
dataset = coll.find({"NumCommits : { "$gt" : 0 } },
				     {"AuthorID": 1, "NumCommits": 1, "_id": 0},
				     no_cursor_timeout=True)

for data in dataset:
    print(data)
```
