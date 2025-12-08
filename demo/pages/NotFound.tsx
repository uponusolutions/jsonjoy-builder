import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Anchor, Center, Container, Stack, Text, Title } from "@mantine/core";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("Bad route", location.pathname);
  }, [location.pathname]);

  return (
    <Center h="100vh" bg="gray.1">
      <Container>
        <Stack align="center" gap="md">
          <Title order={1} size={60}>404</Title>
          <Text size="xl" c="dimmed">Oops! Page not found</Text>
          <Anchor href="/" size="lg">
            Return to Home
          </Anchor>
        </Stack>
      </Container>
    </Center>
  );
};

export default NotFound;
