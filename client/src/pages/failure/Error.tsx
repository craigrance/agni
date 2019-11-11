import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Menu from '../../components/Menu';
import React, { Fragment } from 'react';
import Typography from '@material-ui/core/Typography';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: `calc(100vh - 124px)`
    },
    button: {
      width: 196,
      margin: theme.spacing(2.4)
    }
  })
);

const Error = () => {
  const classes = useStyles();
  const history = useHistory();

  const goBack = () => {
    const storedReturnLocation = localStorage.getItem('returnLocation');
    if (typeof storedReturnLocation === 'string') {
      const returnLocation = JSON.parse(storedReturnLocation);
      history.push(returnLocation);
    }
  };

  return (
    <Fragment>
      <Menu />
      <Box onClick={() => goBack()}>
        <Container maxWidth='md'>
          <Box className={classes.root}>
            <Typography variant='h1'>Error.</Typography>
          </Box>
        </Container>
      </Box>
    </Fragment>
  );
};

export default Error;