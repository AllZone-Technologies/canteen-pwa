import { verifyToken } from "../utils/jwt";

export function withAuth(handler) {
  return async (req, res) => {
    try {
      const token = req.cookies.admin_token;

      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const decoded = await verifyToken(token);

      if (
        !decoded ||
        (decoded.role !== "admin" && decoded.role !== "manager")
      ) {
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

export function withAdminOnly(handler) {
  return async (req, res) => {
    try {
      const token = req.cookies.admin_token;

      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const decoded = await verifyToken(token);

      if (!decoded || decoded.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
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
  const token = context.req.cookies.admin_token;

  if (!token) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  try {
    const decoded = await verifyToken(token);

    if (!decoded || (decoded.role !== "admin" && decoded.role !== "manager")) {
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
