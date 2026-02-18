      try {
        const questions = await generateExam(spaceId || "", 15);
        setQuestions(questions);
        setTimeLeft(questions.length * 90);