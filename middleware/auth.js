import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export function withAuth(handler) {
  return async (req, res) => {
    try {
      const token = req.cookies.adminToken;

      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      if (!decoded || decoded.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Add user info to request
      req.user = decoded;

      return handler(req, res);
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

export function withAuthPage(Component) {
  return function ProtectedRoute(props) {
    return <Component {...props} />;
  };
}

export async function getServerSideProps(context) {
  const token = context.req.cookies.adminToken;

  if (!token) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || decoded.role !== "admin") {
      return {
        redirect: {
          destination: "/admin/login",
          permanent: false,
        },
      };
    }

    return {
      props: {
        user: decoded,
      },
    };
  } catch (error) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }
}
