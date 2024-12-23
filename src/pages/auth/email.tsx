import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

export default function EmailLogin() {
  const { email } = useParams();
  const url = `/?email=${email}`;
  return (
    <div>
      <Helmet>
        <meta httpEquiv="refresh" content={`0;url=${url}`} />
      </Helmet>
      <h1>
        Redirecting to <a href={url}>Email</a> ...
      </h1>
    </div>
  );
}
